export type RiskLevel = 'low'|'medium'|'high';

export interface Segment {
  id: string;
  page: number;                // 1-based page index
  bbox: { x: number; y: number; w: number; h: number }; // normalized (0..1)
  text: string;
  risk: RiskLevel;
  simple: string;              // everyday-language line explanation
}

export interface Clause {
  id: string;
  title: string;
  original: string;
  simple: string;
  why: string;
  risk: RiskLevel;
  page?: number;
  citations?: { title: string; url: string }[];
}

export interface PageAnalysis {
  pageNumber: number;
  text: string;
  summary: string;
  keyPoints: Array<{
    type: string;
    title: string;
    explanation: string;
  }>;
  riskLevel: RiskLevel;
  clauses: any[];
}

export interface AnalysisResult {
  summary: string;
  overallRisk: RiskLevel;
  clauses: Clause[];
  language: 'en'|'hi'|'hinglish';
  segments?: Segment[];         // NEW: for visual canvas line-by-line
  pageAnalysis?: PageAnalysis[]; // NEW: real page-by-page analysis
}
