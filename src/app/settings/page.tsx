'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import {
  KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle,
  RefreshCw, ExternalLink, Database, Sliders, Shield, Trash2,
} from 'lucide-react';
import { DEFAULT_MODEL_ID } from '@/lib/config';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, initDefaultApiKey } from '@/lib/apiKey';

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);

  // NVIDIA API Key state
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    initDefaultApiKey().finally(() => {
      const stored = getStoredApiKey();
      setApiKey(stored);
      setHasStoredKey(!!stored);
    });
  }, []);

  const handleTestKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatusMsg({ type: 'error', text: 'Please enter an API key to test.' });
      return;
    }

    setIsVerifying(true);
    setStatusMsg({ type: 'info', text: 'Verifying API key with NVIDIA NIM...' });

    try {
      const res = await fetch('/api/settings/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setStatusMsg({
          type: 'success',
          text: data.message || 'Key verified! Connection to NVIDIA NIM successful.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: data.error || 'Verification failed. Please check your key at build.nvidia.com.',
        });
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Network error verifying key. Check your internet connection.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatusMsg({ type: 'error', text: 'Please enter an API key before saving.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg({ type: 'info', text: 'Verifying and saving key...' });

    try {
      // 1. Verify with NVIDIA first
      const verifyRes = await fetch('/api/settings/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.valid) {
        setStatusMsg({
          type: 'error',
          text: verifyData.error || 'Key verification failed. Key was not saved.',
        });
        setIsSaving(false);
        return;
      }

      // 2. Save client-side in localStorage
      setStoredApiKey(trimmed);
      setHasStoredKey(true);

      // 3. Also persist to .env.local on the server
      await fetch('/api/settings/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      }).catch(() => {});

      setStatusMsg({
        type: 'success',
        text: 'API Key saved and activated! All models and embeddings are now powered by this key.',
      });
    } catch {
      setStoredApiKey(trimmed);
      setHasStoredKey(true);
      setStatusMsg({
        type: 'success',
        text: 'API Key saved locally in your browser.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setApiKey('');
    setHasStoredKey(false);
    setStatusMsg({ type: 'info', text: 'Saved API key cleared from browser.' });
  };

  const sections = [
    {
      icon: Database,
      title: 'Supabase Configuration',
      color: '#16a34a',
      bg: '#dcfce7',
      items: [
        { key: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Your Supabase project URL', required: true },
        { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous/public key (safe for browser)', required: true },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key (server-side only)', required: true },
      ],
    },
    {
      icon: Sliders,
      title: 'NVIDIA NIM Default Settings',
      color: '#16a34a',
      bg: '#f0fdf4',
      items: [
        { key: 'NVIDIA_PRIMARY_MODEL', description: 'Primary chat model ID (default: nvidia/nemotron-3.5-bolt-e4b)', required: false },
        { key: 'NVIDIA_FALLBACK_MODEL', description: 'First fallback model ID (default: google/diffusiongemma-26b-a4b-it)', required: false },
        { key: 'NVIDIA_EMBEDDING_MODEL', description: 'Embedding model ID (default: nvidia/nemotron-3.5-embed-1b)', required: false },
        { key: 'NVIDIA_EMBEDDING_DIMENSION', description: 'Embedding vector dimension (default: 2048)', required: false },
      ],
    },
    {
      icon: Sliders,
      title: 'RAG & Retrieval Settings',
      color: '#7c3aed',
      bg: '#ede9fe',
      items: [
        { key: 'RAG_TOP_K', description: 'Maximum number of chunks to retrieve (default: 5)', required: false },
        { key: 'RAG_SIMILARITY_THRESHOLD', description: 'Minimum similarity score 0–1 (default: 0.3)', required: false },
        { key: 'CHUNK_SIZE', description: 'Character count per chunk (default: 1000)', required: false },
        { key: 'CHUNK_OVERLAP', description: 'Overlap between chunks (default: 200)', required: false },
      ],
    },
  ];

  return (
    <div className="app-shell">
      <TopNav selectedModel={selectedModel} onModelSelect={setSelectedModel} />
      <div className="app-body">
        <Sidebar />
        <main className="floating-main" style={{ overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Configure your NVIDIA API credentials and system parameters.
            </p>
          </div>

          {/* ── Interactive NVIDIA NIM API Key Card ──────────────────────── */}
          <div
            className="floating-card"
            style={{
              padding: '24px 28px',
              marginBottom: 24,
              border: '1.5px solid rgba(22, 163, 74, 0.3)',
              background: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <KeyRound size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    NVIDIA NIM API Key
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748b' }}>
                    Powers Llama 3.1 70B, Nemotron 51B, Llama 3.3 70B, and document embeddings
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: hasStoredKey ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${hasStoredKey ? '#bbf7d0' : '#fde68a'}`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: hasStoredKey ? '#166534' : '#92400e',
                }}
              >
                {hasStoredKey ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertCircle size={14} color="#d97706" />}
                <span>{hasStoredKey ? 'Connected & Active' : 'Not Configured'}</span>
              </div>
            </div>

            {/* Input Row */}
            <div style={{ marginBottom: 14 }}>
              <label
                htmlFor="settings-nvidia-key"
                style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}
              >
                Insert API Key (starts with <code style={{ color: '#2563eb' }}>nvapi-</code>)
              </label>
              <div style={{ display: 'flex', gap: 10, maxWidth: 650 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    id="settings-nvidia-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="nvapi-..."
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      fontSize: 13.5,
                      borderRadius: 12,
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      color: '#0f172a',
                      fontFamily: showKey ? 'monospace' : 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: 4,
                    }}
                    title={showKey ? 'Hide key' : 'Show key'}
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isVerifying || !apiKey.trim()}
                  className="btn"
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '9px 16px',
                    borderRadius: 12,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Testing...
                    </>
                  ) : (
                    'Test Key'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={isSaving || !apiKey.trim()}
                  className="btn btn-primary"
                  style={{
                    padding: '9px 20px',
                    borderRadius: 12,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Key'
                  )}
                </button>

                {hasStoredKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="btn btn-ghost"
                    style={{ color: '#dc2626', padding: '9px 12px' }}
                    title="Clear saved key"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Feedback Message */}
            {statusMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  marginBottom: 12,
                  maxWidth: 650,
                  background:
                    statusMsg.type === 'success'
                      ? '#ecfdf5'
                      : statusMsg.type === 'error'
                      ? '#fef2f2'
                      : '#f8fafc',
                  color:
                    statusMsg.type === 'success'
                      ? '#065f46'
                      : statusMsg.type === 'error'
                      ? '#991b1b'
                      : '#334155',
                  border: `1px solid ${
                    statusMsg.type === 'success'
                      ? '#a7f3d0'
                      : statusMsg.type === 'error'
                      ? '#fecaca'
                      : '#e2e8f0'
                  }`,
                }}
              >
                {statusMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="#16a34a" />
                <span>Saved to your browser and synced with local runtime.</span>
              </div>
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#2563eb',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Get a free key from build.nvidia.com (1,000 free credits) <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Configuration sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="floating-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: section.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={section.color} />
                    </div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{section.title}</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {section.items.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(255, 255, 255, 0.65)',
                          borderRadius: 12,
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          gap: 16,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <code
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: '#0f172a',
                            }}
                          >
                            {item.key}
                          </code>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{item.description}</span>
                        </div>
                        <span
                          className={`badge ${item.required ? 'badge-warning' : 'badge-neutral'}`}
                          style={{ flexShrink: 0 }}
                        >
                          {item.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
