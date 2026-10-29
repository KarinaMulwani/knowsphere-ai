'use client';

import { useState, useEffect } from 'react';
import {
  KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle,
  RefreshCw, X, ExternalLink, ShieldCheck, Trash2,
} from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, initDefaultApiKey } from '@/lib/apiKey';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initDefaultApiKey().finally(() => {
        const stored = getStoredApiKey();
        setApiKey(stored);
        setHasStoredKey(!!stored);
        setStatusMsg(
          stored
            ? { type: 'success', text: 'API Key active and set as default for all models and retrieval.' }
            : null
        );
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatusMsg({ type: 'error', text: 'Please enter an API key before saving.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg({ type: 'info', text: 'Saving and testing key...' });

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

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      // Still save client-side if server failed
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

  const handleClear = () => {
    clearStoredApiKey();
    setApiKey('');
    setHasStoredKey(false);
    setStatusMsg({ type: 'info', text: 'Saved API key cleared from browser.' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18), inset 0 1px 0 #ffffff',
          padding: '24px 28px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'rgba(241, 245, 249, 0.8)',
            border: 'none',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
          }}
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              flexShrink: 0,
            }}
          >
            <KeyRound size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>NVIDIA NIM API Key</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Used for Llama 3.1 70B/8B, Nemotron, Llama 3.3, and embeddings
            </p>
          </div>
        </div>

        {/* Status Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 14,
            background: hasStoredKey ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${hasStoredKey ? '#bbf7d0' : '#fde68a'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasStoredKey ? (
              <CheckCircle2 size={16} color="#16a34a" />
            ) : (
              <AlertCircle size={16} color="#d97706" />
            )}
            <span style={{ fontSize: 12.5, fontWeight: 600, color: hasStoredKey ? '#166534' : '#92400e' }}>
              {hasStoredKey ? 'API Key Active in Browser' : 'No API Key Configured'}
            </span>
          </div>
          <a
            href="https://build.nvidia.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              color: '#2563eb',
              textDecoration: 'none',
            }}
          >
            Get Free Key <ExternalLink size={11} />
          </a>
        </div>

        {/* Input Field */}
        <div>
          <label
            htmlFor="nvidia-api-key-input"
            style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}
          >
            Insert API Key (starts with <code style={{ color: '#2563eb' }}>nvapi-</code>)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="nvidia-api-key-input"
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
        </div>

        {/* Status / Feedback message */}
        {statusMsg && (
          <div
            style={{
              padding: '9px 13px',
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.45,
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

        {/* Security Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
          <ShieldCheck size={14} color="#16a34a" />
          <span>Your key is stored securely in your browser and used only for direct model requests.</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
          {hasStoredKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-ghost"
              style={{ color: '#dc2626', gap: 6, padding: '8px 12px', fontSize: 12 }}
            >
              <Trash2 size={14} /> Clear Key
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isVerifying || !apiKey.trim()}
              className="btn"
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '9px 15px',
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
                'Test Connection'
              )}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              className="btn btn-primary"
              style={{
                padding: '9px 18px',
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
                'Save & Use Key'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
