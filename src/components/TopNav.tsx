'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, KeyRound, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import ModelSelector from './ModelSelector';
import KnowSphereLogo from './KnowSphereLogo';
import ApiKeyModal from './ApiKeyModal';
import { hasStoredApiKey, initDefaultApiKey } from '@/lib/apiKey';
import { getAppMode, setAppMode, type AppMode } from '@/lib/store';

interface TopNavProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

export default function TopNav({ selectedModel, onModelSelect }: TopNavProps) {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(false);
  const [appMode, setAppModeState] = useState<AppMode>('demo');

  useEffect(() => {
    const checkKey = () => setIsKeyActive(hasStoredApiKey());
    initDefaultApiKey().finally(() => checkKey());
    setAppModeState(getAppMode());

    const handleKeyUpdate = () => checkKey();
    const handleModeUpdate = () => setAppModeState(getAppMode());

    window.addEventListener('knowsphere_key_updated', handleKeyUpdate);
    window.addEventListener('knowsphere_mode_changed', handleModeUpdate);

    return () => {
      window.removeEventListener('knowsphere_key_updated', handleKeyUpdate);
      window.removeEventListener('knowsphere_mode_changed', handleModeUpdate);
    };
  }, []);

  return (
    <>
      <header className="floating-header">
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <KnowSphereLogo size={32} />
          <div>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              KnowSphere AI
            </p>
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1, marginTop: 2 }}>
              Internal Knowledge Assistant
            </p>
          </div>
        </div>

        {/* Global Search Pill Bar */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              id="global-search"
              type="text"
              placeholder="Search documents, chats…"
              style={{
                width: '100%',
                padding: '8px 14px 8px 36px',
                fontSize: 13,
                borderRadius: 9999,
                background: 'rgba(255, 255, 255, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
                outline: 'none',
                color: '#1e293b',
              }}
            />
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          {/* Mode Switch: Demo vs Clean Start */}
          <button
            id="app-mode-toggle-btn"
            onClick={() => {
              const nextMode: AppMode = appMode === 'demo' ? 'clean' : 'demo';
              setAppMode(nextMode);
              setAppModeState(nextMode);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 9999,
              background: appMode === 'demo' ? 'rgba(238, 242, 255, 0.9)' : 'rgba(241, 245, 249, 0.9)',
              border: `1px solid ${appMode === 'demo' ? '#c7d2fe' : '#cbd5e1'}`,
              fontSize: 12,
              fontWeight: 600,
              color: appMode === 'demo' ? '#4338ca' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
            title={
              appMode === 'demo'
                ? 'Currently in Demo Mode (showing approved company docs). Click for Clean Start.'
                : 'Currently in Clean Start Mode (empty slate). Click for Demo Mode.'
            }
          >
            {appMode === 'demo' ? <Sparkles size={13} color="#4f46e5" /> : <Layers size={13} color="#64748b" />}
            <span>{appMode === 'demo' ? 'Demo Data' : 'Clean Start'}</span>
          </button>

          {/* API Key Action Pill */}
          <button
            id="api-key-header-btn"
            onClick={() => setApiKeyModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 11px',
              borderRadius: 9999,
              background: isKeyActive ? '#f0fdf4' : 'rgba(255, 255, 255, 0.72)',
              border: `1px solid ${isKeyActive ? '#bbf7d0' : 'rgba(226, 232, 240, 0.9)'}`,
              fontSize: 12,
              fontWeight: 600,
              color: isKeyActive ? '#166534' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
            title="Configure NVIDIA API Key"
          >
            <KeyRound size={13} color={isKeyActive ? '#16a34a' : '#64748b'} />
            <span>{isKeyActive ? 'API Key Active' : 'API Key'}</span>
            {isKeyActive && <CheckCircle2 size={12} color="#16a34a" />}
          </button>

          {/* NVIDIA Model selector dropdown */}
          <ModelSelector selectedModel={selectedModel} onSelect={onModelSelect} />

          {/* Notifications */}
          <button
            id="notifications-btn"
            className="btn btn-ghost btn-icon"
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
            aria-label="Notifications"
          >
            <Bell size={15} color="#475569" />
            <span
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 6.5,
                height: 6.5,
                borderRadius: '50%',
                background: '#ef4444',
                border: '1.5px solid #ffffff',
              }}
            />
          </button>

          {/* User Profile */}
          <button
            id="profile-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '3px 8px 3px 3px',
              background: 'rgba(255, 255, 255, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              borderRadius: 9999,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            aria-label="Profile menu"
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 12.5,
                flexShrink: 0,
              }}
            >
              K
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>Karina</p>
              <p style={{ fontSize: 10, color: '#64748b' }}>Student</p>
            </div>
            <ChevronDown size={12} color="#64748b" style={{ marginLeft: 2 }} />
          </button>
        </div>
      </header>

      {/* NVIDIA API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />
    </>
  );
}
