import { NextRequest, NextResponse } from 'next/server';
import type { AnalysisResult } from '../../../lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { result, filename } = await req.json() as { result: AnalysisResult, filename: string };
    
    // Generate HTML report with color coding
    const htmlReport = generateColorCodedReport(result, filename);
    
    return new Response(htmlReport, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename.replace('.pdf', '')}_analysis.html"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

function generateColorCodedReport(result: AnalysisResult, filename: string): string {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'high': return 'rgba(239, 68, 68, 0.1)';
      case 'medium': return 'rgba(245, 158, 11, 0.1)';
      case 'low': return 'rgba(16, 185, 129, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lucid Analysis Report - ${filename}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f8fafc;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 16px 0;
            color: #3b82f6;
            font-size: 28px;
        }
        .summary {
            background: white;
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .risk-indicator {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .clause {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            border-left: 6px solid;
        }
        .clause-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        .clause-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
        }
        .original-text {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            margin: 16px 0;
            font-family: ui-monospace, monospace;
            font-size: 14px;
            white-space: pre-wrap;
        }
        .simple-explanation {
            background: rgba(16, 185, 129, 0.05);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #10b981;
            margin: 16px 0;
        }
        .why-matters {
            background: rgba(59, 130, 246, 0.05);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            margin: 16px 0;
        }
        .section-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
            opacity: 0.8;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #64748b;
            font-size: 14px;
        }
        @media print {
            body { background: white; }
            .clause, .summary, .header { box-shadow: none; border: 1px solid #e2e8f0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Lucid Analysis Report</h1>
        <p><strong>Document:</strong> ${filename}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <div style="margin-top: 16px;">
            <span class="risk-indicator" style="background: ${getRiskBg(result.overallRisk)}; color: ${getRiskColor(result.overallRisk)};">
                Overall Risk: ${result.overallRisk}
            </span>
        </div>
    </div>

    <div class="summary">
        <h2>◉ Executive Summary</h2>
        <div>${result.summary}</div>
    </div>

    <h2>▪ Detailed Analysis</h2>
    ${result.clauses.map(clause => `
        <div class="clause" style="border-left-color: ${getRiskColor(clause.risk)};">
            <div class="clause-header">
                <h3 class="clause-title">${clause.title}</h3>
                <span class="risk-indicator" style="background: ${getRiskBg(clause.risk)}; color: ${getRiskColor(clause.risk)};">
                    ${clause.risk}
                </span>
            </div>
            
            <div class="original-text">
                <div class="section-label">◦ Original Text</div>
                ${clause.original}
            </div>
            
            <div class="simple-explanation">
                <div class="section-label" style="color: #10b981;">✦ In Simple Words</div>
                ${clause.simple}
            </div>
            
            <div class="why-matters">
                <div class="section-label" style="color: #3b82f6;">▶ Why This Matters</div>
                ${clause.why}
            </div>
        </div>
    `).join('')}

    <div class="footer">
        <p>Generated by <strong>Lucid</strong> - Legal documents, simplified</p>
        <p>This analysis is for informational purposes only and does not constitute legal advice.</p>
    </div>
</body>
</html>`;
}
