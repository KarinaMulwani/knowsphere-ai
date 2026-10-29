'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import {
  LayoutDashboard, Database, MessageSquare, FileText, CheckCircle, XCircle, Clock, RefreshCw,
  Sparkles, Key, Check,
} from 'lucide-react';
import { DEFAULT_MODEL_ID } from '@/lib/config';
import { getStoredApiKey } from '@/lib/apiKey';
import {
  getDashboardStats,
  getAppMode,
  setAppMode,
  type AppMode,
} from '@/lib/store';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    indexedDocuments: 0,
    processingDocuments: 0,
    failedDocuments: 0,
    totalChunks: 0,
    totalConversations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [appMode, setAppModeState] = useState<AppMode>('demo');
  const [hasApiKey, setHasApiKey] = useState(false);

  const syncStats = () => {
    setLoading(true);
    const mode = getAppMode();
    setAppModeState(mode);

    // Dynamic stats from store
    const localStats = getDashboardStats();
    setStats(localStats);

    const userKey = getStoredApiKey();
    setHasApiKey(!!userKey);

    // Also attempt remote dashboard sync
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((remote) => {
        if (remote && remote.totalDocuments > 0) {
          // If remote DB actually has data, combine or use
          setStats((prev) => ({
            ...prev,
            totalDocuments: Math.max(prev.totalDocuments, remote.totalDocuments),
            indexedDocuments: Math.max(prev.indexedDocuments, remote.indexedDocuments),
            totalChunks: Math.max(prev.totalChunks, remote.totalChunks),
            totalConversations: Math.max(prev.totalConversations, remote.totalConversations),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    syncStats();

    const handleUpdate = () => syncStats();
    window.addEventListener('knowsphere_docs_updated', handleUpdate);
    window.addEventListener('knowsphere_history_updated', handleUpdate);
    window.addEventListener('knowsphere_mode_changed', handleUpdate);

    return () => {
      window.removeEventListener('knowsphere_docs_updated', handleUpdate);
      window.removeEventListener('knowsphere_history_updated', handleUpdate);
      window.removeEventListener('knowsphere_mode_changed', handleUpdate);
    };
  }, []);

  const StatCard = ({ label, value, icon: Icon, color, bg }: {
    label: string; value: number | string; icon: React.ElementType; color: string; bg: string;
  }) => (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      {loading
        ? <div className="skeleton" style={{ height: 32, width: '40%' }} />
        : <p style={{ fontSize: 30, fontWeight: 800, color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      }
    </div>
  );

  return (
    <div className="app-shell">
      <TopNav selectedModel={selectedModel} onModelSelect={setSelectedModel} />
      <div className="app-body">
        <Sidebar documentCount={stats.indexedDocuments} chunkCount={stats.totalChunks} />
        <main className="floating-main" style={{ overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
                <span
                  className="badge badge-neutral"
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 700,
                  }}
                >
                  {appMode === 'demo' ? '✨ Demo Mode' : '🧹 Clean Start'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Real-time knowledge assistant metrics, document index status, and system health.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAppMode(appMode === 'demo' ? 'clean' : 'demo')}
              >
                {appMode === 'demo' ? '🧹 Switch to Clean Start' : '✨ Load Demo Data'}
              </button>
              <button id="refresh-dashboard-btn" className="btn btn-secondary btn-sm" onClick={syncStats}>
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Documents" value={stats.totalDocuments} icon={Database} color="var(--color-accent)" bg="var(--color-accent-light)" />
            <StatCard label="Indexed Documents" value={stats.indexedDocuments} icon={CheckCircle} color="var(--color-success)" bg="var(--color-success-light)" />
            <StatCard label="Total Chunks" value={stats.totalChunks} icon={FileText} color="var(--color-purple)" bg="var(--color-purple-light)" />
            <StatCard label="Conversations" value={stats.totalConversations} icon={MessageSquare} color="#0ea5e9" bg="#e0f2fe" />
            <StatCard label="Processing" value={stats.processingDocuments} icon={Clock} color="var(--color-warning)" bg="var(--color-warning-light)" />
            <StatCard label="Failed" value={stats.failedDocuments} icon={XCircle} color="var(--color-error)" bg="var(--color-error-light)" />
          </div>

          {/* Setup checklist */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Deployment & System Status</h2>
            {[
              {
                label: 'NVIDIA NIM API Key',
                done: true,
                note: hasApiKey ? 'Custom User Key active' : 'Default environment key active (nemotron-3.5-bolt-e4b)',
              },
              {
                label: 'Knowledge Assistant Mode',
                done: true,
                note: appMode === 'demo'
                  ? 'Demo Mode active (5 approved documents, 24 chunks, 3 sample conversations)'
                  : 'Clean Start Mode active (0 documents, 0 conversations)',
              },
              {
                label: 'Approved Company Knowledge',
                done: stats.indexedDocuments > 0,
                note: stats.indexedDocuments > 0
                  ? `${stats.indexedDocuments} documents available with source citations & grounded RAG`
                  : 'Ready for document upload in Clean Start Mode',
              },
              {
                label: 'Fast Local & Cloud RAG Pipeline',
                done: true,
                note: 'Sub-second response latency with built-in token matching + vector similarity fallback',
              },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '12px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: item.done ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.done
                    ? <CheckCircle size={14} color="var(--color-success)" />
                    : <Clock size={14} color="var(--color-warning)" />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', margin: 0 }}>{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
