'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { AnalysisResult, Clause } from '../lib/types';
import DOMPurify from 'isomorphic-dompurify';
import PDFVisualCanvas from './components/PDFVisualCanvas';
import SimplePDFCanvas from './components/SimplePDFCanvas';
import { 
  FileText, 
  Search, 
  BarChart3, 
  List, 
  Palette, 
  MessageCircle, 
  Download, 
  AlertTriangle, 
  Check, 
  BookOpen, 
  Lightbulb, 
  Bot, 
  Rocket, 
  Brain,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Flag,
  Files,
  Globe
} from 'lucide-react';

// Visual Canvas Component
function VisualCanvas({ result }: { result: AnalysisResult }) {
  const [hoveredClause, setHoveredClause] = useState<string | null>(null);

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
      case 'high': return 'rgba(239, 68, 68, 0.15)';
      case 'medium': return 'rgba(245, 158, 11, 0.15)';
      case 'low': return 'rgba(16, 185, 129, 0.15)';
      default: return 'rgba(107, 114, 128, 0.15)';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Document Canvas */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid var(--border)',
        minHeight: '600px',
        position: 'relative'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '24px',
          color: 'var(--text)',
          textAlign: 'center',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '16px'
        }}>
          <FileText className="inline-block w-3 h-3 mr-2" />Document Analysis Canvas
        </div>

        {/* Risk sections */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {result.clauses.map((clause, index) => (
            <div
              key={clause.id}
              style={{
                background: getRiskBg(clause.risk),
                border: `2px solid ${getRiskColor(clause.risk)}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredClause === clause.id ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hoveredClause === clause.id ? '0 12px 24px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={() => setHoveredClause(clause.id)}
              onMouseLeave={() => setHoveredClause(null)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: getRiskColor(clause.risk)
                }}>
                  {clause.title}
                </h4>
                <span style={{
                  background: getRiskColor(clause.risk),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {clause.risk}
                </span>
              </div>

              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                opacity: hoveredClause === clause.id ? 1 : 0.8,
                transition: 'opacity 0.3s ease'
              }}>
                {clause.simple}
              </div>

              {hoveredClause === clause.id && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: getRiskColor(clause.risk),
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}>
                    <Search className="inline-block w-3 h-3 mr-1" />Why This Matters
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {clause.why}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Risk Legend */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: getRiskColor('high'), borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>High Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: getRiskColor('medium'), borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Medium Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: getRiskColor('low'), borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Low Risk</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'en'|'hinglish'|'hi'>('en');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<'none'|'summary'|'line'|'ask'|'canvas'|'notes'>('none');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [messageFeedback, setMessageFeedback] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const [notes, setNotes] = useState<Array<{
    id: string;
    page: number;
    summary: string;
    risks: any[];
    timestamp: Date;
  }>>([]);

  // Handle message feedback
  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === feedback ? null : feedback
    }));
  };

  // Handle copy message
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Function to render markdown-like formatting
  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  };

  // Function to format text with proper HTML formatting
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  // Helper function to get content for current page
  const getPageContent = (page: number) => {
    if (!result) return { high: [], medium: [], low: [], summary: '', keyPoints: [] };
    
    // Check if the page exists in the document
    if (page > totalPages) {
      return {
        high: [],
        medium: [],
        low: [],
        summary: `Page ${page} does not exist in this document. This document has ${totalPages} page${totalPages === 1 ? '' : 's'}.`,
        keyPoints: [{
          type: 'info',
          title: 'Page Not Found',
          explanation: `This page number exceeds the total pages in the document. Please navigate to a page between 1 and ${totalPages}.`
        }]
      };
    }
    
    // Check if we have real page analysis data
    const pageAnalysis = (result as any).pageAnalysis;
    if (pageAnalysis && pageAnalysis.length > 0) {
      const realPageData = pageAnalysis.find((p: any) => p.pageNumber === page);
      if (realPageData) {
        // Use real page analysis data
        const riskCounts = {
          high: realPageData.riskLevel === 'high' ? 1 : 0,
          medium: realPageData.riskLevel === 'medium' ? 1 : 0,
          low: realPageData.riskLevel === 'low' ? 1 : 0
        };
        
        return {
          high: realPageData.riskLevel === 'high' ? [{ title: 'High Risk Content', simple: 'This page contains high-risk provisions' }] : [],
          medium: realPageData.riskLevel === 'medium' ? [{ title: 'Medium Risk Content', simple: 'This page contains medium-risk provisions' }] : [],
          low: realPageData.riskLevel === 'low' ? [{ title: 'Low Risk Content', simple: 'This page contains low-risk provisions' }] : [],
          summary: realPageData.summary,
          keyPoints: realPageData.keyPoints || []
        };
      }
    }
    
    // Fallback to clause-based analysis if no real page data
    const pageClauses = result.clauses.filter(clause => clause.page === page);
    
    // If no clauses assigned to this page, create fallback content
    if (pageClauses.length === 0) {
      return {
        high: [],
        medium: [],
        low: [],
        summary: getPageSpecificSummary(page, []),
        keyPoints: getPageSpecificKeyPoints(page, [])
      };
    }
    
    const high = pageClauses.filter(clause => clause.risk === 'high');
    const medium = pageClauses.filter(clause => clause.risk === 'medium');
    const low = pageClauses.filter(clause => clause.risk === 'low');
    
    return { 
      high, 
      medium, 
      low, 
      summary: getPageSpecificSummary(page, pageClauses),
      keyPoints: getPageSpecificKeyPoints(page, pageClauses)
    };
  };
    
    // Generate page-specific summary based on actual clause content
  const getPageSpecificSummary = (page: number, pageClauses: any[]) => {
    if (pageClauses.length === 0) {
      // More dynamic page descriptions based on actual content
      const pageDescriptions = {
        1: "This opening page is like the 'introduction chapter' of your document - it's where everyone gets introduced and the basic rules are set up. Think of it as the foundation of a house: it tells you who's involved in this agreement, what the main purpose is, and defines the key terms you'll see throughout the document. Whether this is an employment contract, lease agreement, loan document, or service contract, this page establishes the fundamental framework. It's usually the safest page with mostly informational content, but it's crucial because these definitions will be used everywhere else. Pay attention to how terms are defined here - if they define key concepts broadly or narrowly, that affects everything that follows.",
        2: "This page typically contains the 'core business terms' - the heart of what this agreement is actually about. If this is an employment contract, you'll find job duties and compensation details. If it's a lease, you'll see rent amounts and property rules. If it's a loan, you'll find interest rates and payment schedules. If it's a service agreement, you'll see what work is being done and how much it costs. This page often contains the most important day-to-day operational details that affect your wallet, your time, and your expectations. The specifics here directly impact your budget and what you can realistically expect from the other party.",
        3: "This page often contains the 'risk and protection' sections - where things can get expensive or legally complicated if something goes wrong. It's where the document explains who pays when things don't go as planned. This might include liability clauses (who pays for damages), dispute resolution procedures (can you go to court or are you forced into arbitration), insurance requirements, and penalty provisions. Whether this is a rental agreement, employment contract, business deal, or loan, these provisions can save or cost you thousands of dollars, so they deserve extra attention. Some clauses are reasonable protection, while others might leave you holding the bag for problems you didn't cause.",
        4: "This final page typically covers 'relationship management and exit strategies' - how your arrangement can change over time and eventually end. This includes termination procedures (how to get out), renewal terms (whether it automatically continues), and 'cleanup' provisions about confidential information or property. Whether you're dealing with a job, lease, loan, or business partnership, these terms affect your long-term flexibility and freedom. For example, automatic renewal clauses can trap you longer than intended, while strict termination procedures can make it expensive to leave. Understanding these terms helps you maintain control over your future options."
      };
      return pageDescriptions[page as keyof typeof pageDescriptions] || `Page ${page} contains important provisions that work together with the main agreement terms. While these might seem like technical details, they often include crucial information about how the agreement works in practice, what happens in unusual situations, and how various legal requirements are handled. Think of these as the 'operating manual' for your document - they become very important when you need to reference them during disputes or when circumstances change.`;
    }

    const pageRiskCount = pageClauses.filter(c => c.risk !== 'low').length;
    const clauseTitles = pageClauses.map(clause => clause.title).join(', ');
    const highRiskTitles = pageClauses.filter(c => c.risk === 'high').map(c => c.title);
    const mediumRiskTitles = pageClauses.filter(c => c.risk === 'medium').map(c => c.title);
    
    if (pageRiskCount === 0) {
      return `Page ${page} focuses on ${clauseTitles.toLowerCase()} - these are the 'housekeeping' sections of your contract. Think of this page as setting up the basic framework and administrative details that make everything else work smoothly. These clauses are like the foundation of a building - not the most exciting part, but essential for everything else to function properly. The good news is that this content follows standard business practices and doesn't contain any red flags or unusual terms that could hurt you later. These sections typically include things like: how the parties are officially identified, what key terms mean throughout the document, basic procedures for things like giving notices, and standard legal language that protects both sides equally. You can feel confident about this page and focus your detailed review energy on other parts of the contract that might have more complex terms affecting your money, time, or legal rights.`;
    } else if (pageRiskCount === 1) {
      const riskItem = highRiskTitles[0] || mediumRiskTitles[0];
      const riskLevel = highRiskTitles.length > 0 ? 'high' : 'medium';
      return `Page ${page} covers ${clauseTitles.toLowerCase()}, and while most of this content is standard business language, there's one section that needs your attention: "${riskItem}". This ${riskLevel}-risk clause stands out because it could affect your wallet, your flexibility, or your legal protections in ways that go beyond typical business terms. Think of it like this: most of this page is routine paperwork, but this one clause is like a special condition that changes the normal rules. ${riskLevel === 'high' ? 'This could potentially cost you money, limit your options significantly, or expose you to legal risks that most people wouldn\'t expect in a standard agreement.' : 'This might affect your costs, timeline, or responsibilities in ways that are manageable but worth understanding before you sign.'} The good news is that having just one concern on this page means you can focus your negotiation efforts on this specific issue rather than having to worry about multiple problematic terms.`;
    } else if (pageRiskCount <= 3) {
      const riskItems = [...highRiskTitles, ...mediumRiskTitles].slice(0, 2).join('" and "');
      return `Page ${page} deals with ${clauseTitles.toLowerCase()}, and this page requires more careful attention because it contains several terms that could impact you: specifically "${riskItems}" and ${pageRiskCount - 2} other concerning provisions. Think of this page as the 'terms and conditions' that go beyond standard business practices - these are the clauses where the other party is asking for something extra or different from what you'd typically expect. ${highRiskTitles.length > 0 ? 'Some of these terms could significantly affect your costs, legal rights, or business flexibility.' : 'These terms generally involve moderate impacts to your obligations, costs, or procedures.'} This isn't necessarily a deal-breaker, but it's definitely a 'slow down and read carefully' situation. You'll want to understand exactly what you're agreeing to here and consider whether these terms are acceptable for your situation. If any of these clauses feel unfair or overly restrictive, they're good candidates for negotiation before you sign.`;
    } else {
      const criticalItems = highRiskTitles.slice(0, 2).join('" and "');
      return `Page ${page} is a 'high attention' section covering ${clauseTitles.toLowerCase()}, with multiple concerning terms including "${criticalItems}" and ${pageRiskCount - 2} other risk areas. This page goes well beyond standard business terms and contains clauses that could significantly impact your financial exposure, legal rights, or business operations. Think of this as the 'fine print that really matters' - these aren't just technical legal details, but terms that could cost you money, limit your flexibility, or put you at a disadvantage if problems arise later. ${highRiskTitles.length > 0 ? 'The high-risk items here could potentially expose you to substantial costs, legal liability, or operational restrictions that go far beyond what most people expect when entering a business agreement.' : ''} This page deserves your full attention and possibly a consultation with a lawyer, especially if this is an important or expensive agreement. Many of these terms might be negotiable, but you need to understand what you're accepting before you sign.`;
    }
  };

  // Generate page-specific key points
  const getPageSpecificKeyPoints = (page: number, pageClauses: any[]) => {
    let keyPoints: any[] = [];
    
    if (pageClauses.length === 0) {
      // Fallback key points based on typical page content
      const fallbackPoints = {
        1: [
          { type: 'info', title: 'Who\'s Who and What\'s What', explanation: 'This section is like the \'cast of characters\' - it tells you exactly who is involved in this deal and what role everyone plays. It also defines the key terms that will be used throughout the contract. For example, when the contract says \'Client\' later on, it refers back to the definition here. Pay attention to how broadly or narrowly terms are defined - if \'Services\' is defined very broadly, it might include things you didn\'t expect to pay for.' },
          { type: 'info', title: 'When This Agreement Kicks In', explanation: 'This covers the timeline of your relationship - when it starts, how long it lasts, and any important dates you need to remember. Some agreements start immediately when signed, others start on a specific date. The duration might be fixed (like 1 year) or ongoing until someone ends it. Understanding this timeline helps you plan your budget and commitments.' },
          { type: 'info', title: 'The Basic Ground Rules', explanation: 'Think of this as the \'operating instructions\' for how this business relationship will work. It covers basic procedures like how to communicate officially (email okay, or must be written letters?), what happens if someone\'s contact information changes, and other administrative details that keep things running smoothly. These might seem boring, but they matter when you need to give official notice or make changes later.' }
        ],
        2: [
          { type: 'medium', title: 'What You\'re Actually Getting (Or Giving)', explanation: 'This is the heart of the deal - exactly what services, products, or work is being provided. Read this carefully because it defines what you can expect to receive and what standards it must meet. Vague descriptions here can lead to disappointment later. For example, \'website development\' could mean a simple 3-page site or a complex e-commerce platform - the details matter for both expectations and pricing.' },
          { type: 'medium', title: 'The Money Talk', explanation: 'This covers all the financial aspects: how much you pay, when you pay it, what happens if you\'re late, and any additional costs that might come up. Look for details about late fees, interest charges, or expenses you might have to reimburse. Some contracts have reasonable payment terms (like net 30 days), while others might require immediate payment or have harsh penalties for late payments.' },
          { type: 'info', title: 'How Things Get Done Day-to-Day', explanation: 'This section explains the practical workflow - how you\'ll communicate, what approvals are needed, how changes are handled, and what the typical process looks like. Understanding this helps set realistic expectations about response times, decision-making processes, and how smoothly (or not) things are likely to go.' }
        ],
        3: [
          { type: 'high', title: 'Who Pays When Things Go Wrong', explanation: 'This is often the most expensive section if you don\'t pay attention to it. It determines who is responsible for damages, accidents, lawsuits, or other problems that might arise. Some clauses are reasonable (like each party covers their own mistakes), while others might make you responsible for things beyond your control. For example, you might be required to pay the other party\'s legal fees even if they\'re partly at fault, or you might be limited in how much you can recover if they cause you significant losses.' },
          { type: 'high', title: 'How Fights Get Resolved', explanation: 'When disagreements happen (and they do), this section controls your options. Some contracts require expensive arbitration instead of letting you go to court. Others might require disputes to be handled in a distant state, making it costly to pursue claims. The most restrictive clauses might require you to pay the other party\'s legal costs if you lose, which can make it risky to pursue legitimate complaints.' },
          { type: 'medium', title: 'Insurance and Protection Requirements', explanation: 'This covers what insurance coverage is required and who must protect whom from various types of claims. You might be required to carry expensive insurance policies, or you might need to \'indemnify\' (protect) the other party from certain types of lawsuits, even if those lawsuits aren\'t your fault. Understanding these requirements helps you budget for insurance costs and understand your potential exposure.' }
        ],
        4: [
          { type: 'medium', title: 'How to End This Relationship', explanation: 'Every business relationship eventually ends, and this section explains how. Can you cancel anytime, or are you locked in for a specific period? How much notice must you give? Are there cancellation fees? Some agreements make it easy to leave, while others have expensive early termination penalties or require you to give months of notice. If the terms feel like a \'roach motel\' (easy to get in, hard to get out), that\'s a red flag.' },
          { type: 'medium', title: 'What Happens to Your Ideas and Information', explanation: 'This covers intellectual property (who owns what you create together) and confidentiality (what information must be kept secret). If you\'re sharing trade secrets or creating new innovations, these terms determine your future rights. Some clauses are reasonable (mutual confidentiality), while others might give the other party ownership of your ideas or require you to keep information secret forever, even after the relationship ends.' },
          { type: 'info', title: 'The Fine Print That Ties Everything Together', explanation: 'This includes important but technical details like which state\'s laws apply, how contract changes must be made, and what happens if part of the contract is found to be invalid. While these seem like legal technicalities, they can be important if problems arise. For example, if the contract is governed by laws from a state that heavily favors businesses over individuals, that could affect your rights.' }
        ]
      };
      return fallbackPoints[page as keyof typeof fallbackPoints] || [
        { type: 'info', title: 'Additional Legal Provisions', explanation: 'This page contains supplementary terms that support the main agreement provisions.' }
      ];
    }

    // Create key points from actual clauses on this page
    const high = pageClauses.filter(clause => clause.risk === 'high');
    const medium = pageClauses.filter(clause => clause.risk === 'medium');
    const low = pageClauses.filter(clause => clause.risk === 'low');
    
    // Add high risk points with detailed explanations
    high.slice(0, 2).forEach(clause => {
      keyPoints.push({
        type: 'high',
        title: clause.title,
        explanation: clause.simple ? `${clause.simple} This is flagged as high-risk because it could significantly impact your financial exposure, legal rights, or business flexibility. These types of clauses often contain terms that go beyond standard business practices and might limit your options or increase your costs in ways that aren't immediately obvious. Consider whether you're comfortable with these terms or if they should be negotiated before signing.` : `This ${clause.title.toLowerCase()} section contains terms that could significantly impact your rights, costs, or legal protections. High-risk clauses often include things like liability caps that limit your recovery if something goes wrong, mandatory arbitration that restricts your legal options, or penalty clauses that could be expensive if you need to make changes later. Review this carefully and consider getting legal advice if this is an important agreement.`
      });
    });
    
    // Add medium risk points with explanations
    medium.slice(0, 2).forEach(clause => {
      keyPoints.push({
        type: 'medium',
        title: clause.title,
        explanation: clause.simple ? `${clause.simple} This is considered medium-risk because while it's not immediately dangerous, it could affect your costs, timeline, or responsibilities in ways that are worth understanding before you commit. These terms typically involve things like payment schedules, performance standards, or procedural requirements that are manageable but different from standard practices.` : `This ${clause.title.toLowerCase()} section requires attention because it contains terms that could moderately impact your agreement. Medium-risk clauses often involve things like payment terms that are tighter than usual, performance standards that are higher than typical, or procedural requirements that add complexity to your obligations. While usually manageable, these terms are worth reviewing to make sure they fit your situation.`
      });
    });
    
    // Add low risk points with explanations
    low.slice(0, 2).forEach(clause => {
      keyPoints.push({
        type: 'low',
        title: clause.title,
        explanation: clause.simple ? `${clause.simple} This section uses standard business language and follows typical industry practices, so it's considered low-risk. While these terms are important for the overall structure and legal validity of the agreement, they generally don't contain surprises or unusual requirements that would catch most people off-guard.` : `This ${clause.title.toLowerCase()} section contains routine legal language that's commonly found in business agreements. Low-risk clauses typically include things like standard definitions, basic procedural requirements, or administrative details that are necessary for the contract to function properly but don't impose unusual burdens or create unexpected obligations.`
      });
    });
    
    // Ensure we have at least 3 key points
    if (keyPoints.length < 3) {
      keyPoints.push({
          type: 'info', 
        title: 'Page Content Review',
        explanation: `This page contains legal provisions that contribute to the overall agreement structure. While not individually high-risk, these terms work together with other sections to define your rights and obligations.`
      });
    }
    
    // Limit to top 4 points
    return keyPoints.slice(0, 4);
  };

  const currentPageContent = getPageContent(currentPage);
  
  // Function to add current page to notes
  const addToNotes = () => {
    if (!result) return;
    
    const pageContent = getPageContent(currentPage);
    const newNote = {
      id: `note-${Date.now()}`,
      page: currentPage,
      summary: pageContent.summary,
      risks: [...pageContent.high, ...pageContent.medium],
      timestamp: new Date()
    };
    
    setNotes(prevNotes => [...prevNotes, newNote]);
  };

  async function downloadReport() {
    if (!result || !file) return;
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, filename: file.name })
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace('.pdf', '')}_analysis.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  async function startAnalyze(targetMode: 'summary'|'line') {
    if (!file) return;
    setMode(targetMode);
    setProgress('Reading your document…');
    setLoading(true); setAnswer(''); setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('language', language);
      
      setProgress('Analyzing…');
      const res = await fetch('/api/analyze', { method:'POST', body: fd });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to analyze the document.');
      }
      
      // Check if OCR is needed
      if (json.needsOCR) {
        setProgress('Running OCR… this may take a moment');
        await performOCRAnalysis();
      return;
    }

      setResult(json);
      
      // Set total pages from the analysis result
      const pageAnalysis = json.pageAnalysis;
      if (pageAnalysis && pageAnalysis.length > 0) {
        setTotalPages(pageAnalysis.length);
      }
    } catch (err:any) {
      console.error('Analysis failed:', err);
      setResult({
        summary: 'Failed to analyze the document. Please try a different file.',
        overallRisk: 'low',
        clauses: [],
        language
      });
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  async function performOCRAnalysis() {
    if (!file) return;
    try {
      console.log('Starting OCR analysis...');
      setProgress('Loading PDF for OCR...');
      
      const pdfjsLib: any = await import('pdfjs-dist');
      // @ts-ignore
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      console.log(`PDF size: ${arrayBuffer.byteLength} bytes`);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pagesToProcess = Math.min(pdf.numPages, 3);
      console.log(`Processing ${pagesToProcess} pages for OCR`);
      
      setProgress(`Rendering ${pagesToProcess} pages...`);
      const canvases: HTMLCanvasElement[] = [];
      
      for (let i=1; i<=pagesToProcess; i++) {
        console.log(`Rendering page ${i}`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Increased scale for better OCR
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        canvases.push(canvas);
        setProgress(`Rendered page ${i}/${pagesToProcess}`);
      }
      
      setProgress('Initializing OCR engine...');
      console.log('Loading Tesseract worker...');
      
      const { createWorker }: any = await import('tesseract.js');
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      console.log('Tesseract worker initialized, starting text recognition...');
      let text = '';
      let totalPages = canvases.length;
      
      for (let i = 0; i < canvases.length; i++) {
        setProgress(`Extracting text from page ${i + 1}/${totalPages}...`);
        console.log(`Processing canvas ${i + 1}`);
        
        const { data } = await worker.recognize(canvases[i]);
        const pageText = data?.text || '';
        console.log(`Page ${i + 1} extracted ${pageText.length} characters`);
        text += '\n' + pageText;
      }
      
      await worker.terminate();
      console.log(`Total extracted text length: ${text.length} characters`);
      
      if (!text.trim()) {
        throw new Error('No text could be extracted from the PDF');
      }
      
      setProgress('Analyzing extracted text...');
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), language })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'OCR analysis failed');
      setResult(json);
      
      // Set total pages from the OCR analysis result
      const pageAnalysis = json.pageAnalysis;
      if (pageAnalysis && pageAnalysis.length > 0) {
        setTotalPages(pageAnalysis.length);
      } else {
        // Fallback: use the number of pages we processed for OCR
        setTotalPages(pagesToProcess);
      }
      console.log('OCR analysis completed successfully');
    } catch (e:any) {
      console.error('OCR processing failed:', e);
      const troubleshootingTips = [
        "• Try a higher quality scan or PDF",
        "• Ensure the document has clear, readable text",
        "• Try reducing the file size if it's very large",
        "• Check if your browser supports WebAssembly (required for OCR)",
        "• Make sure the PDF is not password protected"
      ].join('\n');
      
      setResult({
        summary: `OCR processing failed: ${e.message}\n\nTroubleshooting tips:\n${troubleshootingTips}\n\nCheck the browser console for more technical details.`,
        overallRisk: 'low',
        clauses: [],
        language
      });
    } finally {
      setProgress('');
    }
  }

  async function handleAsk() {
    if (!file || !question.trim()) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content: question.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMode('ask');
    setProgress('Lucid AI is demystifying your legal docs....');
    setAnswer(''); // Clear previous answer
    
    // Add a typing indicator message
    const typingMessage = {
      id: `typing-${Date.now()}`,
      type: 'assistant' as const,
      content: 'Lucid AI is demystifying your legal docs....',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);
    
    try {
      const res = await fetch('/api/ask', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ 
          question: question.trim(), 
          context: result || null,
          filename: file?.name || 'Unknown document',
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant' as const,
        content: json.answer,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setAnswer(json.answer);
    } catch (error) {
      console.error('Ask error:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setAnswer('Sorry, I encountered an error while processing your question. Please try again.');
    } finally {
      setProgress('');
      setQuestion(''); // Clear the question after sending
    }
  }

  return (
    <>
      <div className="fade-in">
      {/* Main centered card */}
      <div className="glass-card" style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '48px 32px',
        textAlign: 'center'
      }}>
        {/* Logo and Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'transparent',
            borderRadius: '12px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Image 
              src="/zap logo Background Removed copy.png" 
              alt="Lucid AI Logo" 
              width={72}
              height={72}
            />
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}>
            Lucid AI
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            margin: '0 0 32px 0',
            fontWeight: '500'
          }}>
            Demystify your legal documents
            </p>
          </div>

        {/* File Upload Area */}
        <div style={{ marginBottom: '24px' }}>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={e=>setFile(e.target.files?.[0]||null)}
            style={{
              width: '100%',
              padding: '24px',
              fontSize: '16px',
              borderRadius: '12px',
              border: '2px dashed var(--accent)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 200ms ease-in-out',
              color: '#1e293b'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.background = 'var(--glass-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.background = 'var(--glass-bg)';
            }}
          />
            </div>

        {/* Progress Bar */}
        {loading && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress === 'Analyzing...' ? 100 : 50}%` }}
              />
            </div>
        )}

        {/* Action Buttons */}
        {file && !loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '24px'
          }}>
            <button 
              onClick={()=>startAnalyze('summary')} 
              className="btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '14px 20px'
              }}
            >
              <BarChart3 className="w-4 h-4" />
              Summary
            </button>

            <button 
              onClick={()=>startAnalyze('line')} 
              className="btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '14px 20px'
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              Key Risks
            </button>

            <button 
              onClick={()=>setMode('ask')} 
              className="btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '14px 20px'
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Ask
            </button>

            <button 
              onClick={()=>{startAnalyze('line'); setMode('canvas');}} 
              className="btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '14px 20px'
              }}
            >
              <FileText className="w-4 h-4" />
              Page Analysis
            </button>
                  </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '24px',
            color: 'var(--text-secondary)'
          }}>
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
                </div>
            <span>{progress}</span>
          </div>
        )}
      </div>
      </div>

      {/* SUMMARY VIEW */}
      {mode==='summary' && result && (
        <div className="fade-in" style={{ marginTop: '32px' }}>
          <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: 'var(--text)'
                }}>
                  Document Summary
                </h3>
          </div>
              <span className={`risk ${result.overallRisk.toLowerCase()}`}>
                {result.overallRisk.toUpperCase()}
              </span>
        </div>

            <div style={{
              background: 'var(--glass-bg)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              lineHeight: '1.7'
            }}>
              <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(result.summary))}} />
      </div>
            
            {result.clauses.filter(c=>c.risk!=='low').length > 0 && (
              <>
                <h4 style={{
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text)'
                }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  Key Risks to Review
                </h4>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {result.clauses.filter(c=>c.risk!=='low').slice(0,5).map(c=>(
                    <div key={c.id} className="glass-card" style={{
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <span className={`risk ${c.risk.toLowerCase()}`}>
                        {c.risk.toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong style={{
                          color: 'var(--text)',
                          fontSize: '16px',
                          fontWeight: '600',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          {c.title}
                        </strong>
                        <div style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5'
                        }}>
                          {c.simple}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {result.clauses.length > 0 && (
              <div style={{
                textAlign: 'center',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border)'
              }}>
                <button className="btn secondary" onClick={downloadReport} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px'
                }}>
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KEY RISK INSIGHTS VIEW */}
      {mode==='line' && result && (
        <div className="fade-in" style={{ marginTop: '32px' }}>
          {/* Header */}
          <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                <AlertTriangle className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                <h2 style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--text)'
                }}>
                  Key Risk Insights
                </h2>
              </div>
              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                margin: '0 0 24px 0',
                fontWeight: '500'
              }}>
                Top {Math.min(result.clauses.filter(c=>c.risk!=='low').length, 10)} most critical clauses requiring your attention
              </p>
            </div>
            
            {/* Risk Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              flexWrap: 'wrap',
              background: 'var(--glass-bg)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--danger)' }}>
                  {result.clauses.filter(c=>c.risk==='high').length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                  High Risk
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--warn)' }}>
                  {result.clauses.filter(c=>c.risk==='medium').length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                  Medium Risk
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success)' }}>
                  {result.clauses.filter(c=>c.risk==='low').length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                  Low Risk
                </div>
              </div>
            </div>
          </div>
                
          {/* Content - 2 Column Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '24px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {result.clauses
              .filter(c => c.risk !== 'low')
              .slice(0, 10)
              .map((cl: Clause, index: number) => (
              <div key={cl.id} className="glass-card" style={{
                padding: '24px',
                position: 'relative'
              }}>
                {/* Risk Badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px'
                }}>
                  <span className={`risk ${cl.risk.toLowerCase()}`}>
                    {cl.risk.toUpperCase()}
                  </span>
                </div>
                
                {/* Priority Number */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '16px',
                  background: 'var(--accent)',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px var(--accent-glow)'
                }}>
                  {index + 1}
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <h3 style={{
                    margin: '0 0 20px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    lineHeight: '1.3',
                    paddingRight: '80px'
                  }}>
                    {cl.title}
                  </h3>
                  
                  {/* 2 Column Layout for Content */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}>
                    {/* Left Column - Original Clause */}
                    <div style={{
                      background: 'var(--glass-bg)',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--accent)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <FileText className="w-3 h-3" />
                        Original Clause
                      </div>
                      <div style={{
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: 'var(--text-secondary)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace'
                      }}>
                        &quot;{cl.original}&quot;
                      </div>
                    </div>
                    
                    {/* Right Column - AI Explanations */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Plain English */}
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'var(--success)',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Check className="w-3 h-3" />
                          Plain English
                        </div>
                        <div 
                          style={{
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: 'var(--text)',
                            fontWeight: '500'
                          }}
                          dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(cl.simple))}}
                        />
        </div>
                      
                      {/* Why it Matters */}
                      <div style={{
                        background: 'rgba(124, 58, 237, 0.1)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(124, 58, 237, 0.2)'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'var(--accent)',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Lightbulb className="w-3 h-3" />
                          Why it Matters
      </div>
                        <div 
                          style={{
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: 'var(--text)',
                            fontWeight: '500'
                          }}
                          dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(cl.why))}}
                        />
    </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Action Bar */}
          <div className="glass-card" style={{
            textAlign: 'center',
            marginTop: '32px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
    <button
                className="btn secondary"
                onClick={downloadReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px'
                }}
              >
                <Download className="w-4 h-4" />
                Download Report
    </button>
              
              <button
                className="btn"
                onClick={()=>setMode('canvas')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px'
                }}
              >
                <FileText className="w-4 h-4" />
                View Page-by-Page Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE-BY-PAGE ANALYSIS VIEW - FULL SCREEN */}
      {mode==='canvas' && result && file && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'var(--bg-gradient)',
          zIndex: 1000,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr'
        }}>
          {/* Left Side - PDF Viewer (Full Height) */}
          <div style={{
            background: 'var(--panel)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: '1px solid var(--panel-border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <SimplePDFCanvas 
              file={file} 
              result={result} 
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
          
          {/* Right Side - Page Analysis Panel */}
          <div style={{
            background: 'var(--panel)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header with Close and Add to Notes Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                Page {currentPage} Analysis
              </h3>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <button 
                  onClick={addToNotes}
                  className="btn secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Add to My Notes
                </button>
                <button
                  onClick={() => setMode('none')}
                  className="btn secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Close
                </button>
              </div>
            </div>
            
            {/* Page Summary */}
            <div className="glass-card" style={{
              padding: '20px'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                Page Summary
              </h4>
              <div 
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(currentPageContent.summary))}}
      />
    </div>

            {/* Risk Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              <div className="glass-card" style={{
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.2)'
              }}>
                <div style={{fontSize: '24px', fontWeight: '700', color: 'var(--danger)'}}>
                  {currentPageContent.high.length}
                </div>
                <div style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>HIGH</div>
              </div>
              <div className="glass-card" style={{
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <div style={{fontSize: '24px', fontWeight: '700', color: 'var(--warn)'}}>
                  {currentPageContent.medium.length}
                </div>
                <div style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>MEDIUM</div>
              </div>
              <div className="glass-card" style={{
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{fontSize: '24px', fontWeight: '700', color: 'var(--success)'}}>
                  {currentPageContent.low.length}
                </div>
                <div style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>LOW</div>
              </div>
            </div>

            {/* Key Points */}
            {currentPageContent.keyPoints.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M16 12l-4-4-4 4"/>
                    <path d="M12 16V8"/>
                  </svg>
                  Key Points on Page {currentPage}
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px'
                }}>
                  {currentPageContent.keyPoints.map((point: any, idx: number) => {
                    const getIcon = (type: string) => {
                      switch (type) {
                        case 'high':
  return (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
                        case 'medium':
  return (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
                        case 'low':
  return (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
                        default:
  return (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="16" x2="12" y2="12"/>
                              <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}
                    };
                    
  return (
                      <div key={idx} style={{
                        padding: '14px 18px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          marginBottom: '4px'
                        }}>
                          <div style={{ marginTop: '2px' }}>
                            {getIcon(point.type)}
                          </div>
                          <div>
                            <h6 style={{
                              margin: '0 0 6px 0',
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#334155'
                            }}>
                              {point.title}
                            </h6>
                            <div 
                              style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#64748b',
                                lineHeight: '1.5'
                              }}
                              dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(point.explanation))}}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Critical Risks for Current Page */}
            {currentPageContent.high.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
                  Critical Risks on Page {currentPage}
                </h4>
                {currentPageContent.high.slice(0, 2).map((item, idx) => (
                  <div key={`risk-${idx}`} style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.15)'
                  }}>
                    <div style={{
                      fontWeight: '600', 
                      color: '#dc2626', 
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      {item.title}
                    </div>
                    <div 
                      style={{
                        color: '#64748b', 
                        lineHeight: '1.5',
                        fontSize: '13px'
                      }}
                      dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(item.simple))}}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* No Significant Risks Message */}
            {currentPageContent.high.length === 0 && currentPageContent.medium.length === 0 && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#059669',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Low Risk Content on Page {currentPage}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  This page contains routine content with minimal risk concerns.
                </div>
              </div>
            )}
            

            {/* Bottom Actions */}
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <button 
                onClick={downloadReport}
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  color: '#1e40af',
                  border: '1px solid rgba(30, 64, 175, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(30, 64, 175, 0.15)',
                  width: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(30, 64, 175, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(30, 64, 175, 0.15)';
                }}
              >
                <Download className="inline-block w-4 h-4" />
                Download Report
            </button>
              <button 
                onClick={() => setMode('line')}
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  color: '#1e40af',
                  border: '1px solid rgba(30, 64, 175, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(30, 64, 175, 0.15)',
                  width: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(30, 64, 175, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(30, 64, 175, 0.15)';
                }}
              >
                <AlertTriangle className="inline-block w-4 h-4" />
                Key Risk Insights
              </button>
              <button 
                onClick={() => setMode('notes')}
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  color: '#1e40af',
                  border: '1px solid rgba(30, 64, 175, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(30, 64, 175, 0.15)',
                  width: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(30, 64, 175, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(30, 64, 175, 0.15)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                My Notes
            </button>
          </div>
          </div>
        </div>
      )}

      {/* CHAT INTERFACE */}
      {mode==='ask' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div className="glass-card" style={{
            margin: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image 
                  src="/zap logo Background Removed copy.png" 
                  alt="Lucid AI Logo" 
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>
                  Lucid AI
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {file ? 'Ask questions about your document' : 'Upload a document to get started'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMode('none');
                setMessages([]); // Clear conversation history
                setAnswer('');
                setQuestion('');
              }}
              className="btn secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '14px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
          </div>
          
          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Welcome Message */}
            {messages.length === 0 && !progress && (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Image 
                    src="/zap logo Background Removed copy.png" 
                    alt="Lucid AI Logo" 
                    width={40}
                    height={40}
                  />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                  {file ? 'Ready to help!' : 'Upload a document first'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {file 
                    ? 'Ask me anything about your document. I can explain clauses, risks, and help you understand what you\'re signing.'
                    : 'To get the best answers, please upload and analyze a document first using the options above.'
                  }
                </p>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((message) => (
              <div key={message.id} style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{
                  background: message.type === 'user' 
                    ? 'var(--accent)'
                    : 'var(--glass-bg)',
                  color: message.type === 'user' ? 'white' : 'var(--text)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  maxWidth: '75%',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: message.type === 'user' 
                    ? 'none'
                    : '1px solid var(--glass-border)',
                  opacity: (message as any).isTyping ? 0.8 : 1
                }}>
                  {(message as any).isTyping ? (
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                      <span>{message.content}</span>
                    </div>
                  ) : (
                    <>
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: formatMessage(message.content) 
                        }}
                        style={{
                          wordBreak: 'break-word'
                        }}
                      />
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        marginTop: '8px',
                        textAlign: 'right'
                      }}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      
                      {/* Message Actions - Only for assistant messages */}
                      {message.type === 'assistant' && !(message as any).isTyping && (
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '8px',
                          justifyContent: 'flex-end',
                          alignItems: 'center'
                        }}>
                          <button
                            onClick={() => handleFeedback(message.id, 'like')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: messageFeedback[message.id] === 'like' ? 1 : 0.5,
                              transition: 'all 0.2s ease'
                            }}
                            title="Like this response"
                          >
                            <ThumbsUp 
                              size={14} 
                              style={{ 
                                color: messageFeedback[message.id] === 'like' ? '#10B981' : 'currentColor' 
                              }} 
                            />
                          </button>
                          
                          <button
                            onClick={() => handleFeedback(message.id, 'dislike')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: messageFeedback[message.id] === 'dislike' ? 1 : 0.5,
                              transition: 'all 0.2s ease'
                            }}
                            title="Dislike this response"
                          >
                            <ThumbsDown 
                              size={14} 
                              style={{ 
                                color: messageFeedback[message.id] === 'dislike' ? '#EF4444' : 'currentColor' 
                              }} 
                            />
                          </button>
                          
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.5,
                              transition: 'all 0.2s ease'
                            }}
                            title="Copy message"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Loading State - Removed duplicate progress message */}
          </div>

          {/* Input Area */}
          <div className="glass-card" style={{
            margin: '16px',
            padding: '20px 24px'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1 }}>
                <textarea 
                  value={question} 
                  onChange={e => setQuestion(e.target.value)}
                  placeholder={file 
                    ? "Ask me anything about your document..." 
                    : "Upload a document first to ask questions..."
                  }
                  disabled={!file}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (question.trim() && !progress) {
                        handleAsk();
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    maxHeight: '120px',
                    padding: '12px 16px',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    background: file ? 'var(--glass-bg)' : 'var(--glass-bg)',
                    color: file ? 'var(--text)' : 'var(--muted)',
                    transition: 'all 200ms ease-in-out',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--glass-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button 
                onClick={handleAsk} 
                disabled={!question.trim() || !!progress || !file}
                className="btn"
                style={{
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                {progress ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ transform: 'translateX(1px)' }}
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                  </svg>
                )}
              </button>
            </div>
            </div>
            
          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
              </div>
      )}

      {/* MY NOTES VIEW */}
      {mode === 'notes' && (
        <section className="panel" style={{padding: 32, marginTop: 20}}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '700',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              My Notes ({notes.length})
            </h3>
            <button
              onClick={() => setMode('none')}
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                color: '#1e40af',
                border: '1px solid rgba(30, 64, 175, 0.2)',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ✕ Close
            </button>
          </div>

          {notes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '16px',
              border: '2px dashed rgba(30, 64, 175, 0.2)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{margin: '0 auto 16px auto'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <h4 style={{color: '#64748b', marginBottom: '8px'}}>No notes yet</h4>
              <p style={{color: '#94a3b8', fontSize: '14px'}}>
                Use &quot;Add to My Notes&quot; from the Page-by-Page Analysis to save important page information here.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {notes.map((note) => (
                <div key={note.id} style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#334155'
                    }}>
                      Page {note.page} Analysis
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        {note.timestamp.toLocaleDateString()} {note.timestamp.toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#dc2626',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div style={{
                    marginBottom: '16px'
                  }}>
                    <h5 style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#334155'
                    }}>
                      Summary:
                    </h5>
                    <div 
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#64748b',
                        lineHeight: '1.6'
                      }}
                      dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(note.summary))}}
                    />
                  </div>
                  
                  {note.risks.length > 0 && (
                    <div>
                      <h5 style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#334155'
                      }}>
                        Key Risks:
                      </h5>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {note.risks.map((risk, idx) => (
                          <div key={idx} style={{
                            padding: '8px 12px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            fontSize: '13px',
                            color: '#dc2626'
                          }}>
                            <strong>{risk.title}</strong>
                            {risk.simple && (
                            <div 
                              style={{
                                marginTop: '4px',
                                color: '#64748b'
                              }}
                              dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formatText(risk.simple))}}
                            />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
