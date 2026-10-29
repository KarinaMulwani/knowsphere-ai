'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, X, Lightbulb, FileText, Table } from 'lucide-react';
import type { Source } from '@/lib/types';

interface SourcesPanelProps {
  sources?: Source[];
  relatedQuestions?: string[];
  onRelatedQuestion?: (q: string) => void;
  onClose?: () => void;
}

// Fallback sources matching the reference design when none retrieved yet
const DEFAULT_SOURCES: Source[] = [
  {
    chunkId: 'sample-1',
    documentId: 'doc-1',
    filename: 'Refund Policy',
    fileType: 'pdf',
    pageNumber: 3,
    chunkIndex: 0,
    similarity: 0.94,
    excerpt: 'Customers may request a refund within 30 days of purchase if the service has not been substantially used. Refunds are processed to the original payment method within 5–10 business days. Custom services and annual plans are non-refundable.',
  },
  {
    chunkId: 'sample-2',
    documentId: 'doc-2',
    filename: 'Terms of Service',
    fileType: 'pdf',
    pageNumber: 5,
    chunkIndex: 1,
    similarity: 0.88,
    excerpt: 'All accounts must maintain active compliance with terms of service. Breach of terms results in immediate account review and potential suspension without prior notice.',
  },
  {
    chunkId: 'sample-3',
    documentId: 'doc-3',
    filename: 'Pricing Guide',
    fileType: 'xlsx',
    pageNumber: 2,
    chunkIndex: 0,
    similarity: 0.82,
    excerpt: 'Standard tier begins at $29/user/month billed annually. Enterprise volume discounts require approval from sales finance and apply exclusively to annual commitments.',
  },
];

const DEFAULT_RELATED_QUESTIONS = [
  'Are there any non-refundable services?',
  'How long does a refund take to process?',
  'What is considered substantial use?',
  'Where can I find the full refund policy?',
];

export default function SourcesPanel({
  sources = [],
  relatedQuestions = [],
  onRelatedQuestion,
  onClose,
}: SourcesPanelProps) {
  const displaySources = sources.length > 0 ? sources : DEFAULT_SOURCES;
  const displayRelated = relatedQuestions.length > 0 ? relatedQuestions : DEFAULT_RELATED_QUESTIONS;

  const [expandedId, setExpandedId] = useState<string | null>(displaySources[0]?.chunkId ?? null);

  const getBadge = (type: string, filename: string) => {
    if (filename.toLowerCase().includes('pricing') || type === 'xlsx' || type === 'csv') {
      return {
        bg: '#dcfce7',
        color: '#15803d',
        icon: <Table size={13} color="#15803d" />,
      };
    }
    if (filename.toLowerCase().includes('terms') || type === 'docx') {
      return {
        bg: '#dbeafe',
        color: '#1d4ed8',
        icon: <span style={{ fontSize: 9, fontWeight: 800 }}>PDF</span>,
      };
    }
    return {
      bg: '#fee2e2',
      color: '#dc2626',
      icon: <span style={{ fontSize: 9, fontWeight: 800 }}>PDF</span>,
    };
  };

  return (
    <div className="floating-right-panel">
      {/* ── Card 1: Sources ────────────────────────────────────────────── */}
      <div
        className="floating-card"
        style={{
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <BookOpen size={16} color="#1e293b" />
            <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>Sources</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#475569',
                background: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: 9999,
              }}
            >
              {displaySources.length} sources
            </span>
            {onClose && (
              <button
                className="btn btn-ghost btn-icon"
                style={{ padding: 3, width: 22, height: 22, borderRadius: 6 }}
                onClick={onClose}
                aria-label="Close sources panel"
              >
                <X size={14} color="#64748b" />
              </button>
            )}
          </div>
        </div>

        {/* Source Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          {displaySources.map((source, index) => {
            const isExpanded = expandedId === source.chunkId;
            const badge = getBadge(source.fileType, source.filename);
            const sectionLabel = index === 0 ? 'Section 2.1' : index === 1 ? 'Section 4.2' : 'Section 1.3';

            return (
              <div
                key={source.chunkId}
                style={{
                  borderRadius: 14,
                  background: isExpanded ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isExpanded ? '0 2px 10px rgba(0, 0, 0, 0.03)' : 'none',
                }}
              >
                {/* Header row */}
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: 10,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : source.chunkId)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: badge.bg,
                        color: badge.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {badge.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {source.filename}
                      </p>
                      <p style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                        Page {source.pageNumber ?? 1} · {sectionLabel}
                      </p>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronDown size={14} color="#64748b" />
                  ) : (
                    <ChevronRight size={14} color="#64748b" />
                  )}
                </button>

                {/* Expanded Quote Box */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(248, 250, 252, 0.85)',
                      borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                    }}
                  >
                    <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, fontStyle: 'italic' }}>
                      &ldquo;{source.excerpt}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Card 2: Related Questions ──────────────────────────────────── */}
      <div
        className="floating-card"
        style={{
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Lightbulb size={16} color="#d97706" />
          <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>Related Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {displayRelated.map((q, idx) => (
            <button
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.65)',
                border: '1px solid rgba(226, 232, 240, 0.85)',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 10,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.95)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37, 99, 235, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.65)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(226, 232, 240, 0.85)';
              }}
              onClick={() => onRelatedQuestion?.(q)}
            >
              <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.35 }}>{q}</span>
              <ChevronRight size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
