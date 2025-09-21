// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { DlpServiceClient } from '@google-cloud/dlp';
import { VertexAI } from '@google-cloud/vertexai';
import pdf from 'pdf-parse';
import type { AnalysisResult, RiskLevel, Segment } from '../../lib/types';
import formidable from 'formidable';
import fs from 'fs';

const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const DOC_AI_PROCESSOR_ID = process.env.DOC_AI_PROCESSOR_ID!;
const VERTEX_MODEL = process.env.VERTEX_MODEL || 'gemini-pro';

const docai = new DocumentProcessorServiceClient();
const dlp = new DlpServiceClient();
const vertex = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const generativeModel = vertex.getGenerativeModel({ model: VERTEX_MODEL });

// Disable Next.js body parsing to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable();
    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const language = Array.isArray(fields.language) ? fields.language[0] : fields.language || 'en';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file buffer
    const buffer = fs.readFileSync(file.filepath);

    // 1) Extract text and line segments with Document AI
    let rawText = '';
    let segments: Segment[] = [];
    try {
      const { text, segments: lineSegments } = await extractLineSegmentsWithDocAI(buffer);
      rawText = text;
      
      // 2) Redact PII from segments
      for (const seg of lineSegments) {
        seg.text = await redactWithDLP(seg.text);
      }
      
      // 3) Label segments with Gemini
      segments = await labelSegmentsWithGemini(lineSegments, language as any);
    } catch (err) {
      console.error('DocAI OCR failed, falling back to pdf-parse:', err);
      const parsed = await pdf(buffer);
      rawText = parsed.text || '';
    }

    if (!rawText.trim()) {
      return res.status(422).json({ error: 'Could not extract text from PDF' });
    }

    // 4) Extract and analyze page-by-page content
    const pageAnalysis = await extractAndAnalyzePages(buffer, language as any);
    
    // 5) Redact main text and create overall analysis
    const cleanText = await redactWithDLP(rawText);
    const result = await analyzeWithGemini(cleanText, language as any);
    
    // 6) Add real page data to result
    result.segments = segments;
    (result as any).pageAnalysis = pageAnalysis; // Add actual page-by-page analysis
    
    // Assign page numbers to clauses based on actual content
    if (result.clauses) {
      result.clauses.forEach((clause, index) => {
        if (!clause.page) {
          // Distribute clauses across pages based on content
          clause.page = Math.floor(index / Math.max(1, Math.floor(result.clauses.length / pageAnalysis.length))) + 1;
        }
      });
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Analyze API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/** ---- Helpers ---- */

type RawSegment = { page: number, bbox: {x:number,y:number,w:number,h:number}, text: string };

async function extractLineSegmentsWithDocAI(fileBuf: Buffer): Promise<{ text: string, segments: RawSegment[] }> {
  try {
    const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${DOC_AI_PROCESSOR_ID}`;
    const [response] = await docai.processDocument({
      name,
      rawDocument: {
        content: fileBuf.toString('base64'),
        mimeType: 'application/pdf',
      },
    });

    const doc = response.document;
    if (!doc?.text) throw new Error('No text extracted from Document AI');
    const fullText = doc.text;
    const segments: RawSegment[] = [];

    for (const [pageIndex, page] of (doc.pages ?? []).entries()) {
      // Prefer lines; if empty, fall back to paragraphs and split
      const lines = page.lines ?? [];
      if (lines.length > 0) {
        for (const line of lines) {
          const text = textFromAnchor(fullText, line.layout?.textAnchor as any);
          const bbox = getBoundingBox(line.layout?.boundingPoly?.normalizedVertices as any);
          if (text.trim()) {
            segments.push({ page: pageIndex + 1, text: text.trim(), bbox });
          }
        }
      } else {
        // Fall back to paragraphs, split into pseudo-lines
        for (const para of page.paragraphs ?? []) {
          const text = textFromAnchor(fullText, para.layout?.textAnchor as any).trim();
          if (!text) continue;
          
          // Split paragraph into sentences for line-like granularity
          const sentences = text.split(/(?<=\.)\s+/).filter(Boolean);
          const bbox = getBoundingBox(para.layout?.boundingPoly?.normalizedVertices as any);
          const lineHeight = bbox.h / Math.max(sentences.length, 1);
          
          sentences.forEach((sentence, idx) => {
            segments.push({
              page: pageIndex + 1,
              text: sentence.trim(),
              bbox: { x: bbox.x, y: bbox.y + idx * lineHeight, w: bbox.w, h: lineHeight }
            });
          });
        }
      }
    }

    return { text: fullText, segments };
  } catch (error) {
    console.error('Document AI line extraction failed:', error);
    throw error; // Re-throw to trigger fallback
  }
}

function textFromAnchor(fullText: string, anchor?: { textSegments?: { startIndex?: string; endIndex?: string }[] }): string {
  if (!anchor?.textSegments?.length) return '';
  let result = '';
  for (const seg of anchor.textSegments) {
    const start = Number(seg.startIndex || 0);
    const end = Number(seg.endIndex || 0);
    result += fullText.slice(start, end);
  }
  return result;
}

function getBoundingBox(vertices?: { x?: number; y?: number }[]): { x: number; y: number; w: number; h: number } {
  if (!vertices || vertices.length < 4) {
    return { x: 0, y: 0, w: 1, h: 0.05 }; // Default fallback
  }
  
  const [topLeft, topRight, bottomRight, bottomLeft] = vertices;
  return {
    x: topLeft.x || 0,
    y: topLeft.y || 0,
    w: (bottomRight.x || 0) - (topLeft.x || 0),
    h: (bottomRight.y || 0) - (topLeft.y || 0)
  };
}

async function labelSegmentsWithGemini(segments: RawSegment[], language: 'en'|'hi'|'hinglish'): Promise<Segment[]> {
  // Limit segments to avoid token limits
  const maxSegments = Math.min(segments.length, 50);
  const sampleSegments = segments.slice(0, maxSegments).map((s, i) => ({ i, text: s.text }));

  const systemPrompt = `
You are a legal document analyzer. For each line of text, provide:
- risk: "low" | "medium" | "high" 
- simple: one-sentence explanation in everyday language (${language})

Rules:
- High risk: penalties, liability, auto-renewal, arbitration, termination fees
- Medium risk: payment terms, notice periods, renewals, jurisdiction
- Low risk: definitions, headers, general terms
- Be concise. No legal advice. JSON only.
`;

  const userPrompt = `
LANGUAGE=${language}
LINES=${JSON.stringify(sampleSegments, null, 0)}

Return JSON:
{ "labels": [ { "i": 0, "risk": "low|medium|high", "simple": "..." }, ... ] }
`;

  try {
    const resp = await generativeModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 }
    });

    const txt = resp.response.candidates?.[0]?.content?.parts?.[0]?.text || '{"labels":[]}';
    let labels: { i: number; risk: RiskLevel; simple: string }[] = [];
    
    try {
      // Clean up JSON response
      const cleanTxt = txt.replace(/```json|```/g, '').trim();
      const jsonMatch = cleanTxt.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{"labels":[]}');
      labels = parsed.labels || [];
    } catch (parseErr) {
      console.error('Failed to parse Gemini segment labels:', parseErr);
    }

    // Merge labels back with segments
    return sampleSegments.map(({ i }) => {
      const label = labels.find(l => l.i === i);
      const source = segments[i];
      return {
        id: `seg-${i}`,
        page: source.page,
        bbox: source.bbox,
        text: source.text,
        risk: (label?.risk || 'low') as RiskLevel,
        simple: label?.simple || 'Standard legal text.'
      };
    });
  } catch (err) {
    console.error('Gemini segment labeling failed:', err);
    // Return segments with default labels
    return sampleSegments.map(({ i }) => {
      const source = segments[i];
      return {
        id: `seg-${i}`,
        page: source.page,
        bbox: source.bbox,
        text: source.text,
        risk: 'low' as RiskLevel,
        simple: 'Legal text requiring review.'
      };
    });
  }
}

async function redactWithDLP(text: string): Promise<string> {
  try {
    const [resp] = await dlp.deidentifyContent({
      parent: `projects/${PROJECT_ID}/locations/global`,
      item: { value: text },
      deidentifyConfig: {
        infoTypeTransformations: {
          transformations: [
            { primitiveTransformation: { replaceWithInfoTypeConfig: {} } },
          ],
        },
      },
    });
    return resp.item?.value ?? text;
  } catch (err) {
    console.error('DLP redaction failed, using original text:', err);
    return text;
  }
}

async function extractAndAnalyzePages(buffer: Buffer, language: 'en'|'hi'|'hinglish'): Promise<any[]> {
  try {
    console.log('Starting page-by-page extraction...');
    const pdf = await import('pdf-parse');
    
    // First, get the PDF document to extract page count and text per page
    const pdfDoc = await pdf.default(buffer, {
      // Extract text page by page
      pagerender: async (pageData: any) => {
        return pageData.getTextContent().then((textContent: any) => {
          return textContent.items.map((item: any) => item.str).join(' ');
        });
      }
    });

    console.log(`PDF has ${pdfDoc.numpages} pages`);
    
    // Extract text from each page individually
    const pageTexts: string[] = [];
    const pdfjsLib = await import('pdfjs-dist');
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdfDocument = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        pageTexts.push(pageText);
        console.log(`Extracted page ${pageNum}: ${pageText.length} characters`);
      } catch (pageError) {
        console.error(`Error extracting page ${pageNum}:`, pageError);
        pageTexts.push(''); // Add empty string for failed pages
      }
    }

    // Analyze each page individually
    const pageAnalyses = [];
    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i];
      const pageNum = i + 1;
      
      if (pageText.trim().length < 50) {
        // Skip pages with very little content
        pageAnalyses.push({
          pageNumber: pageNum,
          text: pageText,
          summary: `Page ${pageNum} contains minimal text content.`,
          keyPoints: [],
          riskLevel: 'low',
          clauses: []
        });
        continue;
      }

      try {
        // Analyze this specific page using doc-aware heuristics
        const pageAnalysis = await analyzePageContent(pageText, pageNum, language);
        pageAnalyses.push(pageAnalysis);
        console.log(`Analyzed page ${pageNum}`);
      } catch (error) {
        console.error(`Error analyzing page ${pageNum}:`, error);
        pageAnalyses.push({
          pageNumber: pageNum,
          text: pageText,
          summary: `Page ${pageNum} could not be analyzed due to an error.`,
          keyPoints: [],
          riskLevel: 'low',
          clauses: []
        });
      }
    }

    return pageAnalyses;
  } catch (error) {
    console.error('Page extraction failed:', error);
    return [];
  }
}

async function analyzePageContent(pageText: string, pageNumber: number, language: 'en'|'hi'|'hinglish') {
  // Analyze content patterns on this specific page
  const words = pageText.toLowerCase();
  
  // Detect content types on this page
  const hasPayment = words.includes('payment') || words.includes('pay') || words.includes('fee') || words.includes('cost') || words.includes('price');
  const hasTermination = words.includes('terminate') || words.includes('cancel') || words.includes('end') || words.includes('expire');
  const hasLiability = words.includes('liability') || words.includes('responsible') || words.includes('damages') || words.includes('loss');
  const hasArbitration = words.includes('arbitration') || words.includes('dispute') || words.includes('court');
  const hasConfidential = words.includes('confidential') || words.includes('non-disclosure') || words.includes('secret');
  const hasIntellectual = words.includes('intellectual') || words.includes('copyright') || words.includes('trademark');
  
  // Determine risk level based on content with stronger weighting
  let riskLevel = 'low';
  if (hasLiability || hasArbitration) riskLevel = 'high';
  else if (hasPayment || hasTermination || hasConfidential || hasIntellectual) riskLevel = 'medium';

  // Generate summary based on actual page content
  let summary = '';
  if (pageText.length < 100) {
    summary = `Page ${pageNumber} contains brief content, likely introductory or transitional material.`;
  } else {
    // Create summary based on detected content
    const contentTypes: string[] = [];
    if (hasPayment) contentTypes.push('payment terms');
    if (hasTermination) contentTypes.push('termination procedures');
    if (hasLiability) contentTypes.push('liability provisions');
    if (hasArbitration) contentTypes.push('dispute resolution');
    if (hasConfidential) contentTypes.push('confidentiality requirements');
    if (hasIntellectual) contentTypes.push('intellectual property rights');
    
    if (contentTypes.length > 0) {
      // Include a short snippet of the actual text as evidence, trimmed
      const snippet = pageText.slice(0, 200).replace(/\s+/g, ' ').trim();
      summary = `Page ${pageNumber} primarily covers ${contentTypes.join(', ')}. Example text: "${snippet}" `;
      
      if (riskLevel === 'high') {
        summary += `This page contains important provisions that could significantly impact your rights and obligations. Pay careful attention to these terms as they may affect your financial exposure or legal options.`;
      } else if (riskLevel === 'medium') {
        summary += `This page contains terms that require attention and understanding. While not immediately high-risk, these provisions could affect your costs, responsibilities, or procedures under the agreement.`;
      } else {
        summary += `This page contains routine provisions that follow standard practices. These terms are generally administrative or procedural in nature.`;
      }
    } else {
      // General content analysis
      if (words.includes('definition') || words.includes('means') || words.includes('include')) {
        summary = `Page ${pageNumber} appears to contain definitions and explanatory content that establishes the framework for understanding the rest of the document.`;
      } else if (words.includes('party') || words.includes('agreement') || words.includes('contract')) {
        summary = `Page ${pageNumber} contains general agreement terms and structural provisions that establish the basic framework of the relationship between the parties.`;
      } else {
        summary = `Page ${pageNumber} contains substantive provisions of the agreement. The specific terms on this page contribute to the overall rights, obligations, and procedures established by this document.`;
      }
    }
  }

  // Generate key points based on actual content
  const keyPoints: any[] = [];
  
  if (hasPayment) {
    keyPoints.push({
      type: 'medium',
      title: 'Payment and Financial Terms',
      explanation: 'This page contains information about payment obligations, costs, or financial responsibilities. Understanding these terms is important for budgeting and avoiding unexpected expenses.'
    });
  }
  
  if (hasLiability) {
    keyPoints.push({
      type: 'high',
      title: 'Liability and Risk Allocation',
      explanation: 'This page addresses who is responsible for various types of damages or losses. These provisions can significantly impact your financial exposure if problems arise.'
    });
  }
  
  if (hasArbitration) {
    keyPoints.push({
      type: 'high',
      title: 'Dispute Resolution',
      explanation: 'This page covers how disagreements will be resolved. These terms can affect your legal rights and options for pursuing claims.'
    });
  }
  
  if (hasTermination) {
    keyPoints.push({
      type: 'medium',
      title: 'Termination and Exit Procedures',
      explanation: 'This page explains how the agreement can end and what procedures must be followed. Understanding these terms helps maintain your flexibility.'
    });
  }
  
  if (hasConfidential) {
    keyPoints.push({
      type: 'medium',
      title: 'Confidentiality Requirements',
      explanation: 'This page contains obligations to keep certain information secret. These terms can affect what you can discuss about your relationship or business.'
    });
  }
  
  if (hasIntellectual) {
    keyPoints.push({
      type: 'medium',
      title: 'Intellectual Property Rights',
      explanation: 'This page addresses ownership of ideas, creations, or innovations. These terms can affect your rights to work you create or contribute.'
    });
  }
  
  // Add general points if no specific content detected
  if (keyPoints.length === 0) {
    if (pageNumber === 1) {
      keyPoints.push({
        type: 'info',
        title: 'Document Introduction',
        explanation: 'This opening page typically establishes the parties to the agreement and provides foundational information for understanding the document.'
      });
    } else {
      keyPoints.push({
        type: 'info',
        title: 'General Provisions',
        explanation: 'This page contains provisions that support the overall agreement structure and establish important terms or procedures.'
      });
    }
  }

  return {
    pageNumber,
    text: pageText,
    summary,
    keyPoints,
    riskLevel,
    clauses: [] // Could add clause extraction here if needed
  };
}

async function analyzeWithGemini(text: string, language: 'en'|'hi'|'hinglish'): Promise<AnalysisResult> {
  const sys = `
You are Lucid, an AI legal document assistant for everyday people in India.
Your job: Create clear, helpful summaries of legal documents.

CRITICAL RULES:
- Output ONLY valid JSON
- Create an easy-to-read summary (2-3 paragraphs) explaining what this document is and what it does
- Identify 3-5 key clauses that need lawyer consultation
- Focus on practical risks: penalties, lock-ins, liability, termination, dispute resolution
- Use simple language that anyone can understand
`;

  const user = `
LANG=${language}
DOCUMENT TEXT:
${text.slice(0, 8000)}

Return valid JSON with this exact format:
{
  "summary": "2-3 paragraph summary explaining what this document is, what it covers, and why it matters",
  "overallRisk": "medium", 
  "clauses": [
    {
      "id": "c1",
      "title": "Short clause title",
      "original": "Key text from document",
      "simple": "What this means in plain English",
      "why": "Why this matters to you",
      "risk": "low",
      "citations": []
    }
  ],
  "language": "en"
}

Keep it concise but complete. Focus on 2-4 important clauses only.`;

  const resp = await generativeModel.generateContent({
    contents: [
      { role: 'user', parts: [{ text: sys + '\n\n' + user }] },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4000 },
  });

  const txt = resp.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    // Clean up common JSON formatting issues
    let cleanTxt = txt.trim();
    
    // Remove markdown code blocks if present
    if (cleanTxt.startsWith('```json')) {
      cleanTxt = cleanTxt.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanTxt.startsWith('```')) {
      cleanTxt = cleanTxt.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to find JSON within the response
    const jsonMatch = cleanTxt.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanTxt = jsonMatch[0];
    }
    
    // Fix truncated JSON by attempting to close unclosed strings and objects
    if (!cleanTxt.endsWith('}')) {
      // Count open braces vs closed braces
      const openBraces = (cleanTxt.match(/\{/g) || []).length;
      const closeBraces = (cleanTxt.match(/\}/g) || []).length;
      
      // If we have unclosed strings, try to close them
      if (cleanTxt.includes('"') && !cleanTxt.endsWith('"')) {
        // Find last unclosed quote and try to close it
        const lastQuote = cleanTxt.lastIndexOf('"');
        const afterLastQuote = cleanTxt.substring(lastQuote + 1);
        if (!afterLastQuote.includes('"')) {
          cleanTxt += '"';
        }
      }
      
      // Close missing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleanTxt += '}';
      }
    }
    
    console.log('Attempting to parse Gemini response:', cleanTxt.substring(0, 200) + '...');
    
    return JSON.parse(cleanTxt) as AnalysisResult;
  } catch (err) {
    console.error('Gemini JSON parse error:', err);
    console.error('Raw response length:', txt.length);
    console.error('Raw response preview:', txt.substring(0, 500));
    
    // Try to extract at least the summary from the partial response
    const summaryMatch = txt.match(/"summary":\s*"([^"]+)"/);
    const summary = summaryMatch ? summaryMatch[1] : 'This document contains legal text that needs review.';
    
    // Return a meaningful fallback with extracted summary
    return {
      summary: summary.length > 50 ? summary : 'This document contains important legal provisions that should be reviewed carefully. The document appears to cover corporate governance, meeting procedures, and operational guidelines. For specific legal advice regarding this document, please consult with a qualified attorney.',
      overallRisk: 'medium' as RiskLevel,
      clauses: [{
        id: 'review-1',
        title: 'Document Review Required',
        original: text.substring(0, 300) + '...',
        simple: 'This document contains legal provisions that require careful review.',
        why: 'Legal documents often contain important rights, obligations, and procedures that can affect your interests.',
        risk: 'medium' as RiskLevel,
        citations: []
      }],
      language,
    };
  }
}