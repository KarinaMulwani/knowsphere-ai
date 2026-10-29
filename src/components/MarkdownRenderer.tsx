'use client';

import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

type ContentBlock =
  | { type: 'header'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

/**
 * Enhanced Markdown renderer designed for KnowSphere AI responses.
 * Parses headers, bold text, bullet points (both multiline and inline),
 * numbered lists, inline code, and [Source: ...] citation chips.
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // 1. Preprocess: break inline bullets and inline numbered lists into new lines
  const normalized = content
    // Break "* **Key:**" or "* Bullet" that appears inline
    .replace(/([^\n])\s*(\*|-|•)\s+/g, '$1\n* ')
    // Break "1. Item" that appears inline after a period or colon
    .replace(/([.:;])\s+(\d+\.\s+)/g, '$1\n$2')
    // Break "**Header:**" if preceded by normal text on same line
    .replace(/([.:;])\s+(\*\*[A-Z][^*]+:\*\*)/g, '$1\n\n$2\n');

  // 2. Parse lines into grouped blocks (headers, lists, paragraphs)
  const lines = normalized.split('\n');
  const blocks: ContentBlock[] = [];
  let currentList: string[] | null = null;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) blocks.push({ type: 'paragraph', text });
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: 'list', items: currentList });
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Check for Header (e.g. "**Title:**" or "# Title")
    const isHeader =
      (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) ||
      trimmed.startsWith('### ') ||
      trimmed.startsWith('## ') ||
      trimmed.startsWith('# ');

    if (isHeader) {
      flushParagraph();
      flushList();
      const headerText = trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '');
      blocks.push({ type: 'header', text: headerText });
      continue;
    }

    // Check for List item (e.g. "* Item", "- Item", "• Item", "1. Item")
    const listMatch = trimmed.match(/^(\*|-|•|\d+\.)\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      if (!currentList) currentList = [];
      currentList.push(listMatch[2]);
      continue;
    }

    // Otherwise standard paragraph line
    flushList();
    currentParagraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return (
    <div className="knowsphere-markdown" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block, idx) => {
        if (block.type === 'header') {
          return (
            <div
              key={idx}
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.01em',
                marginTop: idx > 0 ? 8 : 2,
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 3.5,
                  height: 15,
                  borderRadius: 2,
                  background: 'linear-gradient(180deg, #2563eb, #3b82f6)',
                  flexShrink: 0,
                }}
              />
              <span>{block.text}</span>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
                background: 'rgba(248, 250, 252, 0.75)',
                border: '1px solid rgba(226, 232, 240, 0.85)',
                borderRadius: 14,
                padding: '12px 16px',
                margin: '2px 0',
              }}
            >
              {block.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 13,
                    lineHeight: 1.58,
                    color: '#1e293b',
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#2563eb',
                      marginTop: 7,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>{renderInlineTokens(item)}</div>
                </div>
              ))}
            </div>
          );
        }

        // Paragraph
        return (
          <p
            key={idx}
            style={{
              fontSize: 13.5,
              lineHeight: 1.68,
              color: '#1e293b',
              margin: 0,
            }}
          >
            {renderInlineTokens(block.text)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Tokenizes and renders bold (**text**), inline code (`code`),
 * and source citations ([Source: ...] or [Document: ...])
 */
function renderInlineTokens(text: string): React.ReactNode[] {
  const regex = /(\[Source:\s*[^\]]+\]|\[Document:\s*[^\]]+\]|\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Source badge
    if (part.startsWith('[Source:') || part.startsWith('[Document:')) {
      const label = part.replace(/^\[(Source|Document):\s*/, '').replace(/\]$/, '');
      return (
        <span
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '1.5px 7px',
            margin: '0 3px',
            borderRadius: 6,
            background: 'rgba(239, 246, 255, 0.95)',
            border: '1px solid rgba(191, 219, 254, 0.9)',
            fontSize: 11,
            fontWeight: 600,
            color: '#1e40af',
            verticalAlign: 'middle',
          }}
          title={label}
        >
          <FileText size={10.5} color="#2563eb" />
          <span style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </span>
      );
    }

    // Bold text
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={idx} style={{ fontWeight: 700, color: '#0f172a' }}>
          {boldContent}
        </strong>
      );
    }

    // Inline code
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={idx}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            background: '#f1f5f9',
            padding: '2px 5px',
            borderRadius: 4,
            color: '#0f172a',
            border: '1px solid #e2e8f0',
          }}
        >
          {codeContent}
        </code>
      );
    }

    // Plain text
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}
