'use client';

import { CHAT_MODELS } from '@/lib/config';
import { useState } from 'react';
import { ChevronDown, Zap, Brain } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
  compact?: boolean;
}

export default function ModelSelector({ selectedModel, onSelect, compact = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const currentModel = CHAT_MODELS.find((m) => m.id === selectedModel) ?? CHAT_MODELS[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="model-selector-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: compact ? '4px 9px' : '5px 12px',
          fontSize: compact ? '11.5px' : '12.5px',
          background: compact ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.72)',
          color: '#1e293b',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 9999,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.15s ease',
        }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* NVIDIA Green Icon */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 15,
            height: 15,
            borderRadius: 4,
            background: '#16a34a',
            color: '#ffffff',
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          ⚡
        </span>
        <span style={{ color: '#0f172a' }}>
          NVIDIA · {currentModel.displayName}
        </span>
        <ChevronDown
          size={12}
          color="#64748b"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            style={{
              position: 'absolute',
              bottom: compact ? 'calc(100% + 8px)' : 'auto',
              top: compact ? 'auto' : 'calc(100% + 8px)',
              right: 0,
              width: 280,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              borderRadius: 18,
              boxShadow: '0 12px 36px rgba(15, 23, 42, 0.12)',
              zIndex: 50,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                NVIDIA NIM Models
              </p>
            </div>
            {CHAT_MODELS.map((model) => (
              <button
                key={model.id}
                role="option"
                aria-selected={model.id === selectedModel}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  background: model.id === selectedModel ? 'rgba(239, 246, 255, 0.9)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                  borderLeft: model.id === selectedModel ? '3px solid #2563eb' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (model.id !== selectedModel) (e.currentTarget as HTMLElement).style.background = 'rgba(241, 245, 249, 0.8)';
                }}
                onMouseLeave={(e) => {
                  if (model.id !== selectedModel) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
                onClick={() => { onSelect(model.id); setOpen(false); }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: model.id === selectedModel ? '#2563eb' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {model.preferReasoning
                    ? <Brain size={13} color={model.id === selectedModel ? '#fff' : '#64748b'} />
                    : <Zap size={13} color={model.id === selectedModel ? '#fff' : '#64748b'} />
                  }
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: model.id === selectedModel ? '#2563eb' : '#0f172a', marginBottom: 2 }}>
                    {model.displayName}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>
                    {model.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
