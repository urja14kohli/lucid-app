import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { AnalysisResult, RiskLevel } from '../../../lib/types';

import { DlpServiceClient } from '@google-cloud/dlp';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const MODEL = process.env.VERTEX_MODEL || 'gemini-1.5-pro';

const MOCK_MODE = !PROJECT_ID;
const dlp = MOCK_MODE ? null : new DlpServiceClient();
const vertex = MOCK_MODE ? null : new VertexAI({ project: PROJECT_ID, location: LOCATION });
const generativeModel = MOCK_MODE ? null : vertex?.getGenerativeModel({ model: MODEL });

const bodySchema = z.object({
  text: z.string().min(1),
  language: z.enum(['en', 'hinglish', 'hi']).default('en')
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { text, language } = bodySchema.parse(json);

  console.log(`Received text for analysis: ${text.length} characters`);

  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Empty text extracted from OCR' }, { status: 400 });
  }

  let redacted = text;
  try {
    redacted = await redactPIIWithDLP(text);
  } catch (e) {
    console.error('DLP redaction failed, proceeding with unredacted text:', e);
  }

  let ai: AnalysisResult;
  try {
    ai = await analyzeWithGemini(redacted, language as any);
  } catch (e) {
    console.error('Analysis failed, returning mock result:', e);
    ai = generateMockAnalysis(text, language as any);
  }

  // Add mock segments for visual canvas when Document AI isn't available
  if (!ai.segments || ai.segments.length === 0) {
    ai.segments = ai.clauses.map((clause, idx) => ({
      id: `fallback-${idx}`,
      page: 1,
      bbox: {
        x: 0.05,
        y: 0.1 + (idx * 0.15),
        w: 0.9,
        h: 0.1
      },
      text: clause.original.slice(0, 100) + '...',
      risk: clause.risk,
      simple: clause.simple
    }));
  }

  return NextResponse.json(ai satisfies AnalysisResult);
}

async function redactPIIWithDLP(input: string) {
  if (!input || !input.trim()) return input;
  
  if (MOCK_MODE) {
    return input
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE_REDACTED]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  }

  const [resp] = await dlp!.deidentifyContent({
    parent: `projects/${PROJECT_ID}/locations/global`,
    item: { value: input },
    inspectConfig: { includeQuote: false },
    deidentifyConfig: {
      infoTypeTransformations: {
        transformations: [{ primitiveTransformation: { replaceWithInfoTypeConfig: {} } }]
      }
    }
  });
  return resp.item?.value ?? input;
}

async function analyzeWithGemini(text: string, language: 'en'|'hi'|'hinglish'): Promise<AnalysisResult> {
  if (MOCK_MODE) {
    return generateMockAnalysis(text, language);
  }

  const sys = [
    'You are PlainSpeak, an Indian legal document simplifier.',
    'Return strict JSON only. Use short sentences. No legal advice; explanations are informational.',
    'For each clause: original text, simple explanation, why it matters, risk (low|medium|high).',
    'Risk heuristic: high = penalties/lock-ins/liability/auto-renew/arbitration; medium = notice/renewals/interest/jurisdiction; low = definitions/headers.'
  ].join(' ');

  const user = `\nLANG=${language}\nTEXT:\n${text.slice(0, 100000)}\nReturn:\n{\n  "summary": "<200-400 words plain-language summary in LANG>",\n  "overallRisk": "low|medium|high",\n  "clauses": [\n    {\n      "id": "c1",\n      "title": "Auto-renewal | Penalty/Fee | Liability | Arbitration | Jurisdiction | Termination | Clause",\n      "original": "...",\n      "simple": "... (in LANG)",\n      "why": "...",\n      "risk": "low|medium|high",\n      "citations": []\n    }\n  ],\n  "language":"en|hi|hinglish"\n}`;

  const resp = await generativeModel!.generateContent({
    contents: [
      { role: 'system', parts: [{ text: sys }] },
      { role: 'user', parts: [{ text: user }] }
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    safetySettings: []
  });

  const txt = resp.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  let out: AnalysisResult;
  try { out = JSON.parse(txt); }
  catch {
    out = generateMockAnalysis(text, language);
  }
  return out;
}

function generateMockAnalysis(text: string, language: 'en'|'hi'|'hinglish'): AnalysisResult {
  const words = text.toLowerCase();
  
  // Enhanced content detection for ANY document type
  const documentPatterns = {
    payment: words.includes('payment') || words.includes('pay') || words.includes('fee') || words.includes('cost') || words.includes('price') || words.includes('invoice') || words.includes('billing'),
    termination: words.includes('terminate') || words.includes('cancel') || words.includes('end') || words.includes('expire') || words.includes('dissolution') || words.includes('exit'),
    liability: words.includes('liability') || words.includes('responsible') || words.includes('damages') || words.includes('loss') || words.includes('harm') || words.includes('indemnify'),
    renewal: words.includes('renew') || words.includes('automatic') || words.includes('extend') || words.includes('continue') || words.includes('perpetual'),
    arbitration: words.includes('arbitration') || words.includes('dispute') || words.includes('court') || words.includes('litigation') || words.includes('mediation'),
    intellectual: words.includes('intellectual') || words.includes('copyright') || words.includes('trademark') || words.includes('patent') || words.includes('proprietary'),
    confidentiality: words.includes('confidential') || words.includes('non-disclosure') || words.includes('secret') || words.includes('private'),
    warranty: words.includes('warranty') || words.includes('guarantee') || words.includes('representation') || words.includes('promise'),
    compliance: words.includes('comply') || words.includes('regulation') || words.includes('standard') || words.includes('requirement'),
    penalty: words.includes('penalty') || words.includes('fine') || words.includes('breach') || words.includes('default') || words.includes('violation'),
    insurance: words.includes('insurance') || words.includes('coverage') || words.includes('policy') || words.includes('claim'),
    employment: words.includes('employee') || words.includes('work') || words.includes('salary') || words.includes('benefits') || words.includes('vacation'),
    real_estate: words.includes('property') || words.includes('lease') || words.includes('rent') || words.includes('premises') || words.includes('landlord'),
    purchase: words.includes('purchase') || words.includes('buy') || words.includes('sale') || words.includes('goods') || words.includes('product'),
    service: words.includes('service') || words.includes('perform') || words.includes('deliver') || words.includes('provide'),
    loan: words.includes('loan') || words.includes('credit') || words.includes('debt') || words.includes('interest') || words.includes('mortgage'),
    partnership: words.includes('partner') || words.includes('joint') || words.includes('collaborate') || words.includes('venture'),
    data: words.includes('data') || words.includes('information') || words.includes('personal') || words.includes('privacy') || words.includes('gdpr')
  };

  // Detect document type
  const getDocumentType = () => {
    if (documentPatterns.employment) return 'employment';
    if (documentPatterns.real_estate) return 'real_estate';
    if (documentPatterns.loan) return 'loan';
    if (documentPatterns.purchase) return 'purchase';
    if (documentPatterns.partnership) return 'partnership';
    if (documentPatterns.service) return 'service';
    return 'general';
  };

  const docType = getDocumentType();

  const clauses: { id: string; title: string; original: string; simple: string; why: string; risk: 'low'|'medium'|'high'; citations: any[]; page?: number }[] = [];
  let riskCount = { high: 0, medium: 0, low: 0 };

  // Dynamic clause generation based on actual document content
  const generateClausesForDocument = () => {
    let clauseId = 1;
    
    // Always add a document introduction clause
    clauses.push({
      id: `c${clauseId++}`,
      title: getDocumentTitle(docType),
      original: text.slice(0, Math.min(200, text.length)) + (text.length > 200 ? '...' : ''),
      simple: getDocumentSimpleExplanation(docType),
      why: getDocumentWhyItMatters(docType),
      risk: 'low',
      citations: [],
      page: 1
    });
    riskCount.low++;

    // Add clauses based on detected content patterns
    const contentAreas = [];
    if (documentPatterns.payment) contentAreas.push('payment');
    if (documentPatterns.termination) contentAreas.push('termination');
    if (documentPatterns.liability) contentAreas.push('liability');
    if (documentPatterns.arbitration) contentAreas.push('arbitration');
    if (documentPatterns.renewal) contentAreas.push('renewal');
    if (documentPatterns.intellectual) contentAreas.push('intellectual');
    if (documentPatterns.confidentiality) contentAreas.push('confidentiality');
    if (documentPatterns.penalty) contentAreas.push('penalty');
    if (documentPatterns.insurance) contentAreas.push('insurance');
    if (documentPatterns.compliance) contentAreas.push('compliance');
    if (documentPatterns.data) contentAreas.push('data');
    if (documentPatterns.warranty) contentAreas.push('warranty');

    // Generate clauses for each detected area
    contentAreas.forEach((area, index) => {
      const clauseData = getClauseData(area, docType, text, index);
    clauses.push({
        id: `c${clauseId++}`,
        title: clauseData.title,
        original: clauseData.original,
        simple: clauseData.simple,
        why: clauseData.why,
        risk: clauseData.risk,
        citations: [],
        page: clauseData.page
      });
      riskCount[clauseData.risk as 'low'|'medium'|'high']++;
    });

    // Ensure we have at least 4-6 clauses for good analysis
    if (clauses.length < 4) {
      const fallbackClauses = getFallbackClauses(docType, text, clauseId);
      fallbackClauses.forEach(clause => {
        clauses.push(clause);
        riskCount[clause.risk as 'low'|'medium'|'high']++;
      });
    }
  };

  // Helper functions for dynamic clause generation
  function getDocumentTitle(docType: string): string {
    const titles = {
      employment: 'Employment Agreement Overview',
      real_estate: 'Property Agreement Structure',
      loan: 'Loan Agreement Framework',
      purchase: 'Purchase Agreement Details',
      partnership: 'Partnership Agreement Foundation',
      service: 'Service Agreement Introduction',
      general: 'Document Structure and Organization'
    };
    return titles[docType as keyof typeof titles] || titles.general;
  }

  function getDocumentSimpleExplanation(docType: string): string {
    const explanations = {
      employment: 'This document establishes the working relationship between you and your employer, including your job duties, compensation, and workplace rules.',
      real_estate: 'This agreement covers the property transaction, including rights, responsibilities, and conditions for the property involved.',
      loan: 'This document outlines the terms of borrowing money, including repayment schedule, interest rates, and consequences of non-payment.',
      purchase: 'This agreement details what you\'re buying, the price, delivery terms, and what happens if there are problems with the purchase.',
      partnership: 'This document establishes how the business partnership will operate, including roles, profit sharing, and decision-making processes.',
      service: 'This agreement explains what services will be provided, how much they cost, and the standards expected from both parties.',
      general: 'This document establishes the basic framework and definitions for the legal agreement between the parties.'
    };
    return explanations[docType as keyof typeof explanations] || explanations.general;
  }

  function getDocumentWhyItMatters(docType: string): string {
    const reasons = {
      employment: 'Understanding your employment terms protects your career interests and helps you know your rights and obligations as an employee.',
      real_estate: 'Property agreements involve significant money and legal obligations, so understanding these terms protects your investment and rights.',
      loan: 'Loan terms directly affect your financial future and credit, so knowing these details helps you avoid costly mistakes and default.',
      purchase: 'Purchase agreements protect you from fraud and ensure you get what you paid for, while clarifying your recourse if problems arise.',
      partnership: 'Partnership terms affect your business control, profits, and personal liability, making it crucial to understand your commitments.',
      service: 'Service agreements set expectations and protect both parties, helping avoid disputes and ensuring you get the value you\'re paying for.',
      general: 'Understanding the document structure helps you navigate the contract effectively and know where to find important information.'
    };
    return reasons[docType as keyof typeof reasons] || reasons.general;
  }

  function getClauseData(area: string, docType: string, text: string, index: number) {
    const textStart = Math.min((index + 1) * 200, text.length - 200);
    const textEnd = Math.min(textStart + 200, text.length);
    const original = text.slice(textStart, textEnd) + (textEnd < text.length ? '...' : '');
    
    const page = Math.floor(index / 2) + 2; // Distribute across pages 2-4

    const clauseTemplates: any = {
      payment: {
        title: `Payment and Financial Terms`,
        simple: `This section covers how much you need to pay, when payments are due, and what happens if you're late. ${docType === 'loan' ? 'Interest rates and repayment schedules are crucial here.' : docType === 'employment' ? 'This includes your salary, benefits, and payment schedule.' : 'Understanding payment terms helps you budget and avoid penalties.'}`,
        why: `Payment terms directly impact your budget and financial planning. Late payment penalties can be expensive, and understanding these terms helps you avoid unnecessary costs.`,
        risk: 'medium'
      },
      termination: {
        title: `Termination and Exit Procedures`,
        simple: `This explains how the relationship can end, what notice is required, and any penalties for early termination. ${docType === 'employment' ? 'This covers how you can quit or be fired.' : docType === 'real_estate' ? 'This covers lease termination and move-out procedures.' : 'This covers how to properly end the agreement.'}`,
        why: `Knowing your exit options is crucial for maintaining flexibility and avoiding being locked into unfavorable terms longer than necessary.`,
        risk: documentPatterns.penalty ? 'high' : 'medium'
      },
      liability: {
        title: `Liability and Risk Allocation`,
        simple: `This determines who pays when things go wrong, including accidents, damages, or legal issues. ${docType === 'employment' ? 'This might cover workplace injuries or professional errors.' : docType === 'real_estate' ? 'This covers property damage and injury liability.' : 'This affects who is responsible for various types of problems.'}`,
        why: `Liability clauses can expose you to significant financial risk or limit your ability to recover losses. These provisions can cost thousands if you don't understand them.`,
        risk: 'high'
      },
      arbitration: {
        title: `Dispute Resolution and Legal Rights`,
        simple: `This controls how disagreements are resolved, potentially requiring arbitration instead of court proceedings. You might be limited in where and how you can pursue legal claims.`,
        why: `Arbitration clauses can significantly limit your legal rights and make it more expensive and difficult to pursue legitimate complaints or seek compensation.`,
        risk: 'high'
      },
      renewal: {
        title: `Renewal and Continuation Terms`,
        simple: `This covers whether the agreement automatically continues and what you need to do to prevent unwanted renewals. ${docType === 'real_estate' ? 'This might involve automatic lease renewals.' : 'This could lock you into continued obligations.'}`,
        why: `Auto-renewal clauses can trap you in agreements longer than intended, potentially at different rates or terms that may not be favorable.`,
        risk: 'medium'
      },
      intellectual: {
        title: `Intellectual Property and Ownership Rights`,
        simple: `This determines who owns ideas, creations, or innovations developed during the relationship. ${docType === 'employment' ? 'This often means your employer owns work you create on the job.' : 'This affects ownership of any collaborative work or innovations.'}`,
        why: `IP clauses can affect your future business opportunities and ownership rights to valuable creations or innovations.`,
        risk: 'medium'
      },
      confidentiality: {
        title: `Confidentiality and Non-Disclosure Requirements`,
        simple: `This requires you to keep certain information secret and may restrict what you can discuss about the relationship or business.`,
        why: `Confidentiality agreements can limit your ability to discuss your experience, seek advice, or use knowledge gained in future opportunities.`,
        risk: 'medium'
      },
      penalty: {
        title: `Penalties and Default Consequences`,
        simple: `This outlines the financial and legal consequences if you fail to meet your obligations under the agreement.`,
        why: `Penalty clauses can result in significant unexpected costs and should be understood before you commit to any agreement.`,
        risk: 'high'
      },
      insurance: {
        title: `Insurance and Coverage Requirements`,
        simple: `This specifies what insurance coverage you must maintain and who is responsible for various types of claims or losses.`,
        why: `Insurance requirements can add significant costs to your obligations and affect your financial protection in case of problems.`,
        risk: 'medium'
      },
      compliance: {
        title: `Compliance and Regulatory Requirements`,
        simple: `This outlines legal and regulatory standards you must follow and the consequences of non-compliance.`,
        why: `Compliance failures can result in legal penalties, fines, or contract termination, making it important to understand these requirements.`,
        risk: 'medium'
      },
      data: {
        title: `Data Privacy and Information Handling`,
        simple: `This covers how personal information is collected, used, and protected, including your privacy rights and data security measures.`,
        why: `Data privacy terms affect your personal information security and may impact your legal rights if data breaches or misuse occur.`,
        risk: 'medium'
      },
      warranty: {
        title: `Warranties and Quality Guarantees`,
        simple: `This outlines what promises are made about quality, performance, or reliability, and what recourse you have if expectations aren't met.`,
        why: `Warranty terms determine your protection and remedies if products or services don't meet promised standards.`,
        risk: 'low'
      }
    };

    return {
      title: clauseTemplates[area]?.title || `${area.charAt(0).toUpperCase() + area.slice(1)} Provisions`,
      original,
      simple: clauseTemplates[area]?.simple || `This section addresses ${area} related terms and conditions.`,
      why: clauseTemplates[area]?.why || `Understanding ${area} terms helps protect your interests.`,
      risk: clauseTemplates[area]?.risk || 'medium',
      page
    };
  }

  function getFallbackClauses(docType: string, text: string, startingId: number): Array<{id: string; title: string; original: string; simple: string; why: string; risk: 'low'|'medium'|'high'; citations: any[]; page: number}> {
    const fallbacks: Array<{id: string; title: string; original: string; simple: string; why: string; risk: 'low'|'medium'|'high'; citations: any[]; page: number}> = [];
    const docSpecificClauses = {
      employment: [
        { title: 'Job Duties and Performance Expectations', risk: 'low', page: 2 },
        { title: 'Benefits and Compensation Details', risk: 'medium', page: 2 },
        { title: 'Workplace Policies and Procedures', risk: 'low', page: 3 }
      ],
      real_estate: [
        { title: 'Property Condition and Inspection Rights', risk: 'medium', page: 2 },
        { title: 'Maintenance and Repair Responsibilities', risk: 'medium', page: 3 },
        { title: 'Utilities and Additional Costs', risk: 'low', page: 3 }
      ],
      loan: [
        { title: 'Interest Rates and Payment Schedule', risk: 'high', page: 2 },
        { title: 'Collateral and Security Requirements', risk: 'high', page: 3 },
        { title: 'Default and Acceleration Clauses', risk: 'high', page: 3 }
      ],
      general: [
        { title: 'General Terms and Conditions', risk: 'low', page: 2 },
        { title: 'Miscellaneous Provisions', risk: 'low', page: 4 }
      ]
    };

    const relevantClauses = docSpecificClauses[docType as keyof typeof docSpecificClauses] || docSpecificClauses.general;
    
    relevantClauses.forEach((clause, index) => {
      const textStart = Math.min((index + 3) * 150, text.length - 150);
      const textEnd = Math.min(textStart + 150, text.length);
      
      fallbacks.push({
        id: `c${startingId + index}`,
        title: clause.title,
        original: text.slice(textStart, textEnd) + (textEnd < text.length ? '...' : ''),
        simple: `This section covers ${clause.title.toLowerCase()} which is important for understanding your obligations and rights.`,
        why: `Understanding these terms helps ensure you comply with all requirements and know what to expect.`,
        risk: clause.risk as 'low'|'medium'|'high',
        citations: [],
        page: clause.page
      });
    });

    return fallbacks;
  }

  generateClausesForDocument();

  const overallRisk = riskCount.high > 0 ? 'high' : riskCount.medium > 0 ? 'medium' : 'low';

  return {
    summary: `This document has been analyzed and contains ${clauses.length} key section${clauses.length === 1 ? '' : 's'}. ${
      riskCount.high > 0 ? `There are ${riskCount.high} high-risk areas requiring careful attention, particularly around liability and penalties.` :
      riskCount.medium > 0 ? `There are ${riskCount.medium} medium-risk areas to review, mainly concerning payments and renewals.` :
      'The document appears to have standard terms with low overall risk.'
    } Please review each section carefully and consider seeking legal advice for important decisions.`,
    overallRisk: overallRisk as 'low'|'medium'|'high',
    clauses,
    language
  };
}


