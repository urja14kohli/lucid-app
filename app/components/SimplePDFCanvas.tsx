'use client';
import { useEffect, useRef, useState } from 'react';
import type { AnalysisResult } from '../../lib/types';

interface Props {
  file: File;
  result: AnalysisResult;
  onPageChange?: (page: number) => void;
}

interface Segment {
  id: string;
  page: number;
  bbox: { x: number; y: number; w: number; h: number };
  text: string;
  risk: 'low' | 'medium' | 'high';
  simple: string;
}

export default function SimplePDFCanvas({ file, result, onPageChange }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Generate segments from available data
  useEffect(() => {
    if (result.segments && result.segments.length > 0) {
      const convertedSegments: Segment[] = result.segments.map((seg, idx) => ({
        id: seg.id || `seg-${idx}`,
        page: seg.page,
        bbox: seg.bbox,
        text: seg.text,
        risk: seg.risk,
        simple: seg.simple
      }));
      setSegments(convertedSegments);
    } else {
      // Fallback: generate from clauses
      const fallbackSegments: Segment[] = result.clauses.map((clause, idx) => ({
        id: `clause-${idx}`,
        page: 1,
        bbox: {
          x: 0.05,
          y: 0.1 + (idx * 0.15),
          w: 0.9,
          h: 0.12
        },
        text: clause.original.slice(0, 100) + '...',
        risk: clause.risk,
        simple: clause.simple
      }));
      setSegments(fallbackSegments);
    }
  }, [result]);

  // Create PDF URL and get page count
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    // Prefer actual PDF page count, but keep analyzed pages as a minimum
    const analyzedPages = (result as any)?.pageAnalysis?.length || 0;
    if (analyzedPages > 0) {
      setTotalPages(analyzedPages);
    }

    const getPdfPageCount = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        // @ts-ignore
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        // Take the maximum so we don't undercount when analysis returns fewer pages
        setTotalPages(prev => Math.max(prev || 1, pdf.numPages));
      } catch (error) {
        console.error('Error getting PDF page count:', error);
        setTotalPages(prev => prev || 1); // Keep whatever we had, fallback to 1
      } finally {
        setLoading(false);
      }
    };
    getPdfPageCount();

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, result]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'high': return 'rgba(239, 68, 68, 0.1)';
      case 'medium': return 'rgba(245, 158, 11, 0.1)';
      case 'low': return 'rgba(34, 197, 94, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>📄 Loading PDF...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Setting up your document viewer</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Controls */}
      <div style={{
        padding: '16px',
        background: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151'
        }}>
          📄 Document Viewer
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Page Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
                onPageChange?.(newPage);
              }}
              disabled={currentPage <= 1}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage <= 1 ? '#9ca3af' : '#374151',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                padding: '4px 8px'
              }}
            >
              ← Prev
            </button>
            <span style={{
              fontSize: '14px',
              color: '#374151',
              minWidth: '80px',
              textAlign: 'center'
            }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1);
                setCurrentPage(newPage);
                onPageChange?.(newPage);
              }}
              disabled={currentPage >= totalPages}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage >= totalPages ? '#9ca3af' : '#374151',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                padding: '4px 8px'
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer - Full Height */}
      <div style={{
        flex: 1,
        background: '#f1f5f9',
        padding: '16px',
        overflow: 'hidden'
      }}>
        {pdfUrl && (
          <iframe
            src={`${pdfUrl}#page=${currentPage}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              background: 'white'
            }}
            title="PDF Document"
          />
        )}
      </div>
    </div>
  );
}