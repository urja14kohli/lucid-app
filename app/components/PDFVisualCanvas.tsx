'use client';
import { useEffect, useRef, useState } from 'react';
import type { Segment } from '../../lib/types';

// Configure PDF.js worker
let pdfjs: any = null;

interface Props {
  file: File;
  segments: Segment[];
}

interface Tooltip {
  x: number;
  y: number;
  segment: Segment;
  visible: boolean;
}

export default function PDFVisualCanvas({ file, segments }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip>({ x: 0, y: 0, segment: {} as Segment, visible: false });
  const [pages, setPages] = useState<{ num: number; width: number; height: number; canvas: HTMLCanvasElement }[]>([]);

  useEffect(() => {
    let cancelled = false;

    const initPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import PDF.js
        if (!pdfjs) {
          pdfjs = await import('pdfjs-dist');
          // Use the bundled worker
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        if (cancelled) return;

        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        const pageData: { num: number; width: number; height: number; canvas: HTMLCanvasElement }[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) break;

          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 }); // Good balance of quality/performance

          // Create canvas for PDF page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render PDF page
          await page.render({ canvasContext: context, viewport }).promise;

          pageData.push({
            num: pageNum,
            width: viewport.width,
            height: viewport.height,
            canvas
          });

          // Create page container
          const pageContainer = document.createElement('div');
          pageContainer.style.cssText = `
            position: relative;
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
            width: ${viewport.width}px;
            height: ${viewport.height}px;
          `;

          // Add canvas to container
          pageContainer.appendChild(canvas);

          // Create overlay for highlights
          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          `;

          // Add highlights for this page
          const pageSegments = segments.filter(seg => seg.page === pageNum);
          pageSegments.forEach(segment => {
            const highlight = createHighlight(segment, viewport.width, viewport.height);
            overlay.appendChild(highlight);
          });

          pageContainer.appendChild(overlay);
          containerRef.current?.appendChild(pageContainer);
        }

        setPages(pageData);
        setLoading(false);
      } catch (err: any) {
        console.error('PDF rendering failed:', err);
        setError(`Failed to render PDF: ${err.message}`);
        setLoading(false);
      }
    };

    initPDF();

    return () => {
      cancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [file, segments]);

  const createHighlight = (segment: Segment, pageWidth: number, pageHeight: number): HTMLDivElement => {
    const div = document.createElement('div');
    
    // Convert normalized coordinates to pixels
    const x = segment.bbox.x * pageWidth;
    const y = segment.bbox.y * pageHeight;
    const w = segment.bbox.w * pageWidth;
    const h = Math.max(16, segment.bbox.h * pageHeight); // Minimum clickable height

    // Color based on risk
    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'high': return 'rgba(239, 68, 68, 0.3)';
        case 'medium': return 'rgba(245, 158, 11, 0.3)';
        case 'low': return 'rgba(34, 197, 94, 0.25)';
        default: return 'rgba(107, 114, 128, 0.2)';
      }
    };

    div.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${w}px;
      height: ${h}px;
      background: ${getRiskColor(segment.risk)};
      border: 1px solid ${getRiskColor(segment.risk).replace('0.3', '0.6').replace('0.25', '0.5').replace('0.2', '0.4')};
      border-radius: 3px;
      cursor: help;
      pointer-events: auto;
      transition: all 0.2s ease;
    `;

    // Hover effects
    div.addEventListener('mouseenter', (e) => {
      div.style.background = getRiskColor(segment.risk).replace(/[\d.]+\)$/, '0.5)');
      div.style.transform = 'scale(1.02)';
      
      // Show tooltip
      const rect = div.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        segment,
        visible: true
      });
    });

    div.addEventListener('mouseleave', () => {
      div.style.background = getRiskColor(segment.risk);
      div.style.transform = 'scale(1)';
      
      // Hide tooltip with delay
      setTimeout(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
      }, 100);
    });

    return div;
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>📄 Rendering PDF...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Please wait while we prepare your visual canvas</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        background: 'rgba(239, 68, 68, 0.1)', 
        borderRadius: '12px',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{ fontSize: '16px', color: '#ef4444', marginBottom: '10px' }}>❌ {error}</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Try refreshing the page or uploading a different PDF file.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginBottom: '20px',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px', opacity: 0.7 }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>🔴 High Risk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '4px', opacity: 0.7 }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>🟡 Medium Risk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#22c55e', borderRadius: '4px', opacity: 0.7 }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>🟢 Low Risk</span>
        </div>
      </div>

      {/* PDF Container */}
      <div 
        ref={containerRef} 
        style={{ 
          textAlign: 'center',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          background: '#f9fafb',
          padding: '20px'
        }}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '300px',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            lineHeight: '1.4'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <span style={{
              background: getRiskBadgeColor(tooltip.segment.risk),
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              textTransform: 'uppercase'
            }}>
              {tooltip.segment.risk}
            </span>
            EXPLANATION
          </div>
          <div>{tooltip.segment.simple}</div>
          
          {/* Tooltip arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(0, 0, 0, 0.9)'
          }} />
        </div>
      )}

      <style jsx>{`
        /* Custom scrollbar for PDF container */
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </>
  );
}
