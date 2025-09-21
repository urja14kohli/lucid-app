import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { AnalysisResult } from '../../../lib/types';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const MODEL = process.env.VERTEX_MODEL || 'gemini-1.5-pro';

// Check if we have the required credentials
const hasCredentials = PROJECT_ID && (
  process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
);

const MOCK_MODE = !hasCredentials;

// Set up credentials for Google Cloud
if (hasCredentials && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = JSON.stringify({
    type: "service_account",
    project_id: PROJECT_ID,
    private_key_id: "d62fec6d38ac6021c202694ab7baa6750f476e0d",
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: "107629132671496374425",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL)}`,
    universe_domain: "googleapis.com"
  });
}

const vertex = MOCK_MODE ? null : new VertexAI({ project: PROJECT_ID, location: LOCATION });
const generativeModel = MOCK_MODE ? null : vertex?.getGenerativeModel({ model: MODEL });

const bodySchema = z.object({
  question: z.string().min(1),
  context: z.any().optional(),
  filename: z.string().optional(),
  conversationHistory: z.array(z.object({
    id: z.string(),
    type: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.any()
  })).optional()
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { question, context, filename, conversationHistory } = bodySchema.parse(json);

    console.log(`Received question: ${question}`);

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Generate AI response based on document context
    const answer = await generateAnswer(question, context, filename, conversationHistory);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' }, 
      { status: 500 }
    );
  }
}

async function generateAnswer(question: string, context?: AnalysisResult, filename?: string, conversationHistory?: any[]): Promise<string> {
  try {
    // If we have document context, use AI to generate a dynamic response
    if (context && context.clauses && context.clauses.length > 0) {
      return await generateDynamicResponse(question, context, conversationHistory);
    }

    // If no context but we have a filename, provide helpful guidance
    if (filename) {
      return await generateDynamicResponse(question, null, conversationHistory, filename);
    }

    // If no file at all, provide general guidance
    return await generateDynamicResponse(question, null, conversationHistory);
  } catch (error) {
    console.error('Error generating AI response:', error);
    return generateFallbackResponse(question, context, filename);
  }
}

async function generateDynamicResponse(question: string, context?: AnalysisResult | null, conversationHistory?: any[], filename?: string): Promise<string> {
  if (MOCK_MODE) {
    return generateMockResponse(question, context, filename);
  }

  // Check if generativeModel is available before proceeding
  if (!generativeModel) {
    console.error('Generative model not available, falling back to mock response');
    return generateMockResponse(question, context, filename);
  }

  // Build context for the AI
  let documentContext = '';
  if (context) {
    documentContext = `
DOCUMENT CONTEXT:
- Document Summary: ${context.summary}
- Overall Risk Level: ${context.overallRisk}
- Key Clauses:
${context.clauses.map(clause => `  • ${clause.title}: ${clause.simple} (Risk: ${clause.risk})`).join('\n')}
`;
  } else if (filename) {
    documentContext = `DOCUMENT CONTEXT: You have access to a document named "${filename}" but it hasn't been analyzed yet.`;
  }

  // Build conversation history context
  let conversationContext = '';
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext = `
CONVERSATION HISTORY:
${conversationHistory.slice(-6).map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
`;
  }

  // Check if we need web search for additional context
  const needsWebSearch = shouldPerformWebSearch(question, context);
  let webSearchResults = '';
  
  if (needsWebSearch) {
    try {
      const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/web-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question, maxResults: 3 })
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          webSearchResults = `
WEB SEARCH RESULTS:
${searchData.results.map((result: any, index: number) => 
  `${index + 1}. **${result.title}**\n   ${result.snippet}\n   Source: ${result.url}`
).join('\n\n')}
`;
        }
      }
    } catch (error) {
      console.error('Web search failed:', error);
    }
  }

  const systemPrompt = `You are Lucid AI, an intelligent and friendly assistant that helps users understand legal documents and answer questions about them. You have access to web search capabilities and can provide comprehensive, accurate responses.

Your personality:
- Be conversational, helpful, and approachable
- Use "I" and "you" to create a personal connection
- Show enthusiasm about helping users understand complex legal concepts
- Use emojis occasionally to make responses more engaging (but not excessively)
- Be encouraging and supportive

Key guidelines:
- Always be helpful, clear, and conversational
- Use the document context when available to provide specific, relevant answers
- Use web search results to supplement your knowledge when relevant
- Explain complex legal concepts in plain language that anyone can understand
- Always remind users that this is informational only, not legal advice
- Be concise but thorough
- Use markdown formatting for better readability
- Cite sources when using web search results
- If you're not sure about something, say so and suggest where they might find more information

${documentContext}
${conversationContext}
${webSearchResults}

User Question: ${question}

Please provide a helpful, accurate, and engaging response based on the available context.`;

  try {
    const response = await generativeModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ],
      generationConfig: { 
        temperature: 0.7, 
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40
      },
      safetySettings: []
    });

    const answer = response.response.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I was unable to generate a response. Please try again.';
    
    // Add a disclaimer at the end
    return `${answer}\n\n---\n*This response is for informational purposes only and does not constitute legal advice. For specific legal questions, please consult with a qualified attorney.*`;
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackResponse(question, context, filename);
  }
}

function generateMockResponse(question: string, context?: AnalysisResult | null, filename?: string): string {
  if (context && context.clauses && context.clauses.length > 0) {
    const relevantClauses = context.clauses.filter(clause => 
      question.toLowerCase().includes(clause.title.toLowerCase()) ||
      clause.title.toLowerCase().includes(question.toLowerCase()) ||
      clause.simple.toLowerCase().includes(question.toLowerCase())
    );

    if (relevantClauses.length > 0) {
      const clause = relevantClauses[0];
      return `Based on the document analysis, here's what I found regarding your question:

**${clause.title}**

${clause.simple}

**Why this matters:** ${clause.why}

**Risk Level:** ${clause.risk.toUpperCase()}

This information is based on the document you uploaded. For specific legal advice, please consult with a qualified attorney.`;
    }

    return `Based on the document you uploaded, here's what I can tell you:

**Document Summary:** ${context.summary}

**Overall Risk Level:** ${context.overallRisk.toUpperCase()}

**Key Areas to Review:**
${context.clauses.slice(0, 3).map(clause => `• ${clause.title} (${clause.risk} risk)`).join('\n')}

For your specific question about *"${question}"*, I'd recommend looking at the relevant sections in the document. The analysis shows this document has ${context.clauses.length} key areas that may be relevant to your question.

**Important:** This is informational only and not legal advice. For specific legal questions, please consult with a qualified attorney.`;
  }

  if (filename) {
    return `I can see you've uploaded *"${filename}"* and asked: *"${question}"*

To give you the most accurate and helpful answer, I need to analyze your document first. Please:

1. **Click one of the analysis buttons above** (Summary, Key Risk Insights, or Page-by-Page Analysis)
2. **Wait for the analysis to complete**
3. **Then ask your question again**

Once I've analyzed your document, I'll be able to provide specific answers based on its actual content, including:
- What the document is about
- Key terms and clauses
- Risk areas to watch out for
- Plain English explanations

**Note:** This tool is designed to help explain legal documents in plain language, but it's not a substitute for professional legal advice.`;
  }

  return `I'd be happy to help answer your question: "${question}"

However, I don't have access to any document context right now. To provide more specific and accurate answers, please:

1. Upload a document first using the file upload above
2. Run an analysis (Summary, Key Risk Insights, or Page-by-Page Analysis)
3. Then ask your question again

This will allow me to give you answers based on the actual content of your document.

**Note:** This tool is designed to help explain legal documents in plain language, but it's not a substitute for professional legal advice.`;
}

function shouldPerformWebSearch(question: string, context?: AnalysisResult | null): boolean {
  // Don't search if we have comprehensive document context
  if (context && context.clauses && context.clauses.length > 0) {
    // Only search if the question seems to be about general legal concepts not in the document
    const questionLower = question.toLowerCase();
    const documentTerms = context.clauses.map(c => c.title.toLowerCase()).join(' ');
    
    // Check if question contains terms not found in document
    const questionWords = questionLower.split(/\s+/).filter(word => word.length > 3);
    const hasUnknownTerms = questionWords.some(word => 
      !documentTerms.includes(word) && 
      !questionLower.includes('what is') && 
      !questionLower.includes('meaning of') &&
      !questionLower.includes('define')
    );
    
    return hasUnknownTerms;
  }
  
  // Always search when no document context
  return true;
}

function generateFallbackResponse(question: string, context?: AnalysisResult | null, filename?: string): string {
  if (context && context.clauses && context.clauses.length > 0) {
    return `I understand you're asking: "${question}"

Based on the document analysis, here's what I can tell you:

**Document Summary:** ${context.summary}

**Overall Risk Level:** ${context.overallRisk.toUpperCase()}

**Key Areas to Review:**
${context.clauses.slice(0, 3).map(clause => `• ${clause.title} (${clause.risk} risk)`).join('\n')}

For your specific question, I'd recommend looking at the relevant sections in the document. The analysis shows this document has ${context.clauses.length} key areas that may be relevant to your question.

**Important:** This is informational only and not legal advice. For specific legal questions, please consult with a qualified attorney.`;
  }

  if (filename) {
    return `I can see you've uploaded *"${filename}"* and asked: *"${question}"*

To give you the most accurate and helpful answer, I need to analyze your document first. Please:

1. **Click one of the analysis buttons above** (Summary, Key Risk Insights, or Page-by-Page Analysis)
2. **Wait for the analysis to complete**
3. **Then ask your question again**

Once I've analyzed your document, I'll be able to provide specific answers based on its actual content.

**Note:** This tool is designed to help explain legal documents in plain language, but it's not a substitute for professional legal advice.`;
  }

  return `I'd be happy to help answer your question: "${question}"

However, I don't have access to any document context right now. To provide more specific and accurate answers, please:

1. Upload a document first using the file upload above
2. Run an analysis (Summary, Key Risk Insights, or Page-by-Page Analysis)
3. Then ask your question again

This will allow me to give you answers based on the actual content of your document.

**Note:** This tool is designed to help explain legal documents in plain language, but it's not a substitute for professional legal advice.`;
}
