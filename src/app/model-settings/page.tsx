'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import ApiKeyModal from '@/components/ApiKeyModal';
import { SlidersHorizontal, Cpu, Brain, Zap, Check, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEFAULT_MODEL_ID, CHAT_MODELS, EMBEDDING_CONFIG, RAG_CONFIG } from '@/lib/config';
import { hasStoredApiKey } from '@/lib/apiKey';

export default function ModelSettingsPage() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(false);

  useEffect(() => {
    const checkKey = () => setIsKeyActive(hasStoredApiKey());
    checkKey();
    window.addEventListener('knowsphere_key_updated', checkKey);
    return () => window.removeEventListener('knowsphere_key_updated', checkKey);
  }, []);

  return (
    <div className="app-shell">
      <TopNav selectedModel={selectedModel} onModelSelect={setSelectedModel} />
      <div className="app-body">
        <Sidebar />
        <main className="floating-main" style={{ overflowY: 'auto', padding: '28px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Model Settings</h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Configure the AI models used for chat inference and document embedding.
              </p>
            </div>

            {/* API Key Status Pill & Action */}
            <button
              onClick={() => setApiKeyModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 14,
                background: isKeyActive ? '#f0fdf4' : '#fffbeb',
                border: `1.5px solid ${isKeyActive ? '#bbf7d0' : '#fde68a'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <KeyRound size={15} color={isKeyActive ? '#16a34a' : '#d97706'} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: isKeyActive ? '#166534' : '#92400e' }}>
                  {isKeyActive ? 'NVIDIA Key Active' : 'No API Key Set'}
                </p>
                <p style={{ fontSize: 10, color: '#64748b' }}>Click to configure</p>
              </div>
              {isKeyActive ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertCircle size={14} color="#d97706" />}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Chat Models */}
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Chat Models (NVIDIA NIM)</h2>
              {CHAT_MODELS.map((model) => (
                <div
                  key={model.id}
                  className="floating-card card-hover"
                  style={{
                    padding: '16px 20px',
                    marginBottom: 10,
                    cursor: 'pointer',
                    border: selectedModel === model.id ? '2px solid var(--color-accent)' : '1px solid rgba(226, 232, 240, 0.85)',
                    background: selectedModel === model.id ? 'rgba(239, 246, 255, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: selectedModel === model.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {model.preferReasoning ? (
                        <Brain size={16} color={selectedModel === model.id ? '#fff' : 'var(--color-text-tertiary)'} />
                      ) : (
                        <Zap size={16} color={selectedModel === model.id ? '#fff' : 'var(--color-text-tertiary)'} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{model.displayName}</p>
                        {model.preferFast && <span className="badge badge-success" style={{ fontSize: 10 }}>Fast</span>}
                        {model.preferReasoning && <span className="badge badge-purple" style={{ fontSize: 10 }}>Reasoning</span>}
                        {selectedModel === model.id && <span className="badge badge-info" style={{ fontSize: 10 }}>Active</span>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{model.description}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{model.id}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Context: {(model.contextLength / 1024).toFixed(0)}k tokens</p>
                    </div>
                    {selectedModel === model.id && (
                      <Check size={16} color="var(--color-accent)" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Embedding & RAG */}
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Embedding Model</h2>
              <div className="floating-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--color-purple-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Cpu size={16} color="var(--color-purple)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>NVIDIA Embedding</p>
                    <span className="badge badge-neutral" style={{ fontSize: 10 }}>Separate from chat</span>
                  </div>
                </div>
                {[
                  { label: 'Model', value: EMBEDDING_CONFIG.model },
                  { label: 'Dimension', value: `${EMBEDDING_CONFIG.dimension}` },
                  { label: 'Provider', value: 'NVIDIA NIM' },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{row.value}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 10 }}>
                  Embeddings run via NVIDIA NIM ({EMBEDDING_CONFIG.model}) using your active API key.
                </p>
              </div>

              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>RAG Retrieval Settings</h2>
              <div className="floating-card" style={{ padding: '16px 20px' }}>
                {[
                  { label: 'Top K (max chunks)', value: `${RAG_CONFIG.topK}`, key: 'RAG_TOP_K' },
                  { label: 'Similarity threshold', value: `${RAG_CONFIG.similarityThreshold}`, key: 'RAG_SIMILARITY_THRESHOLD' },
                  { label: 'Chunk size', value: `${RAG_CONFIG.chunkSize} chars`, key: 'CHUNK_SIZE' },
                  { label: 'Chunk overlap', value: `${RAG_CONFIG.chunkOverlap} chars`, key: 'CHUNK_OVERLAP' },
                  { label: 'Max upload size', value: `${RAG_CONFIG.maxFileSize / 1024 / 1024} MB`, key: 'N/A' },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500 }}>{row.label}</span>
                      {row.key !== 'N/A' && <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{row.key}</p>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>{row.value}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 10 }}>
                  Configured in lib/config.ts with override support via .env.local
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* NVIDIA API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />
    </div>
  );
}
