'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import {
  MessageSquare, Plus, ChevronRight, Trash2, Clock, Sparkles, AlertCircle
} from 'lucide-react';
import { DEFAULT_MODEL_ID } from '@/lib/config';
import {
  getStoredConversations,
  deleteStoredConversation,
  getAppMode,
  type StoredConversation,
} from '@/lib/store';

export default function HistoryPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [appMode, setAppModeState] = useState<'demo' | 'clean'>('demo');

  const loadConversations = () => {
    setLoading(true);
    const mode = getAppMode();
    setAppModeState(mode);

    // Load from local store
    const stored = getStoredConversations();
    setConversations(stored);

    // Also attempt remote fetch if available
    fetch('/api/conversations')
      .then((r) => r.json())
      .then((d) => {
        if (d.conversations && d.conversations.length > 0) {
          // Merge unique IDs
          const storedIds = new Set(stored.map((c) => c.id));
          const remoteOnly = d.conversations.filter((c: any) => !storedIds.has(c.id));
          if (remoteOnly.length > 0) {
            setConversations([...stored, ...remoteOnly]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();

    const handleUpdate = () => loadConversations();
    window.addEventListener('knowsphere_history_updated', handleUpdate);
    window.addEventListener('knowsphere_mode_changed', handleUpdate);

    return () => {
      window.removeEventListener('knowsphere_history_updated', handleUpdate);
      window.removeEventListener('knowsphere_mode_changed', handleUpdate);
    };
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteStoredConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const handleOpenConversation = (id: string) => {
    router.push(`/?c=${id}`);
  };

  return (
    <div className="app-shell">
      <TopNav selectedModel={selectedModel} onModelSelect={setSelectedModel} />
      <div className="app-body">
        <Sidebar onNewChat={() => router.push('/')} />
        <main className="floating-main" style={{ overflowY: 'auto', padding: '28px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Chat History</h1>
                <span
                  className="badge badge-neutral"
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 700,
                  }}
                >
                  {appMode === 'demo' ? '✨ Demo Mode' : '🧹 Clean Mode'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {conversations.length} saved {conversations.length === 1 ? 'conversation' : 'conversations'} in your internal knowledge assistant.
              </p>
            </div>
            <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={15} /> New Chat
            </Link>
          </div>

          {loading ? (
            <div className="card" style={{ padding: 24 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 11, width: '25%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
              <MessageSquare size={44} style={{ margin: '0 auto 16px', opacity: 0.25, color: '#2563eb' }} />
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No chat history yet</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                {appMode === 'clean'
                  ? 'Clean Start mode is active. Start a new conversation or toggle to "Demo Data" in the top bar to inspect sample chats.'
                  : 'Start asking questions about your company documents to see conversation threads saved here.'}
              </p>
              <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <Plus size={14} /> Start new chat
              </Link>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              {conversations.map((conv, i) => {
                const messageCount = conv.messages?.length || 0;
                const lastMsg = conv.messages?.[conv.messages.length - 1];
                const snippet = lastMsg?.content ? lastMsg.content.slice(0, 110) + '…' : '';

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleOpenConversation(conv.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      borderBottom: i < conversations.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 246, 255, 0.45)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(191, 219, 254, 0.6)',
                      }}
                    >
                      <MessageSquare size={18} color="#2563eb" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.title}
                        </p>
                        {messageCount > 0 && (
                          <span
                            style={{
                              fontSize: 10.5,
                              padding: '1px 6px',
                              borderRadius: 10,
                              background: 'var(--color-surface-2)',
                              color: 'var(--color-text-secondary)',
                              fontWeight: 600,
                            }}
                          >
                            {messageCount} msg{messageCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {snippet && (
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85 }}>
                          {snippet}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {new Date(conv.updated_at).toLocaleDateString()} at{' '}
                          {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {conv.model_used && (
                          <span>· {conv.model_used.split('/').pop()}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={(e) => handleDelete(e, conv.id)}
                        aria-label="Delete conversation"
                        title="Delete conversation"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-tertiary)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} color="var(--color-text-tertiary)" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
