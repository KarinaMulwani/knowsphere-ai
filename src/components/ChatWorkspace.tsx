'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Copy, ThumbsUp, ThumbsDown,
  Sparkles, FileText,
  AlertCircle, RefreshCw, ChevronRight, Check, User as UserIcon,
} from 'lucide-react';
import type { UIMessage, Source } from '@/lib/types';
import { DEFAULT_MODEL_ID } from '@/lib/config';
import ModelSelector from './ModelSelector';
import KnowSphereLogo from './KnowSphereLogo';
import ApiKeyModal from './ApiKeyModal';
import MarkdownRenderer from './MarkdownRenderer';
import { getStoredApiKey } from '@/lib/apiKey';
import { getAppMode, getStoredConversations, saveStoredConversation } from '@/lib/store';

interface ChatWorkspaceProps {
  conversationId: string | null;
  onConversationStart: (id: string) => void;
  onSourcesUpdate: (sources: Source[], related: string[]) => void;
  selectedModel: string;
  onModelSelect: (id: string) => void;
  onRelatedQuestion?: (q: string) => void;
  initialQuestion?: string;
}

// Initial demo message matching the reference design screenshot
const INITIAL_DEMO_MESSAGES: UIMessage[] = [
  {
    id: 'demo-user-1',
    role: 'user',
    content: 'What is our refund policy?',
    timestamp: new Date(),
  },
  {
    id: 'demo-assistant-1',
    role: 'assistant',
    content:
      'According to the company’s *Refund Policy* document, customers can request a refund within 30 days of purchase if the service has not been substantially used. Refunds are processed to the original payment method within 5–10 business days.\n\nThere are some exceptions, including custom services and annual plans, which are non-refundable. You can find the full details in the cited source below.',
    timestamp: new Date(),
    sources: [
      {
        chunkId: 'citation-1',
        documentId: 'doc-1',
        filename: 'Refund Policy',
        fileType: 'pdf',
        pageNumber: 3,
        chunkIndex: 0,
        similarity: 0.94,
        excerpt:
          'Customers may request a refund within 30 days of purchase if the service has not been substantially used…',
      },
    ],
  },
];

export default function ChatWorkspace({
  conversationId,
  onConversationStart,
  onSourcesUpdate,
  selectedModel,
  onModelSelect,
  initialQuestion,
}: ChatWorkspaceProps) {
  const [messages, setMessages] = useState<UIMessage[]>(() => {
    if (typeof window !== 'undefined' && getAppMode() === 'clean') return [];
    return INITIAL_DEMO_MESSAGES;
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Store onSourcesUpdate in a ref to avoid infinite re-render cycles
  const onSourcesUpdateRef = useRef(onSourcesUpdate);
  useEffect(() => {
    onSourcesUpdateRef.current = onSourcesUpdate;
  }, [onSourcesUpdate]);

  useEffect(() => {
    setMounted(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const handleModeChange = () => {
      const mode = getAppMode();
      if (!activeConvId) {
        setMessages(mode === 'clean' ? [] : INITIAL_DEMO_MESSAGES);
      }
    };

    window.addEventListener('knowsphere_mode_changed', handleModeChange);
    return () => window.removeEventListener('knowsphere_mode_changed', handleModeChange);
  }, [activeConvId]);

  // Sync conversation ID from props or load from store (depends ONLY on conversationId)
  useEffect(() => {
    setActiveConvId(conversationId);
    if (conversationId) {
      const stored = getStoredConversations().find((c) => c.id === conversationId);
      if (stored && stored.messages?.length > 0) {
        const loadedMsgs: UIMessage[] = stored.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          sources: m.sources,
          modelUsed: m.modelUsed,
        }));
        setMessages(loadedMsgs);
        const lastWithSources = [...loadedMsgs].reverse().find((m) => m.sources && m.sources.length > 0);
        if (lastWithSources?.sources) {
          onSourcesUpdateRef.current(lastWithSources.sources, []);
        }
        return;
      }
    }

    // No conversation selected: respect Clean vs Demo mode
    const mode = typeof window !== 'undefined' ? getAppMode() : 'demo';
    setMessages(mode === 'clean' ? [] : INITIAL_DEMO_MESSAGES);
  }, [conversationId]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Auto-scroll when messages update or loading state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [messages, isLoading, scrollToBottom]);

  // Handle auto-triggered questions (e.g. from Related Questions)
  useEffect(() => {
    if (initialQuestion) {
      sendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const question = (textOverride ?? input).trim();
      if (!question || isLoading) return;

      setInput('');

      const userMsg: UIMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
        timestamp: new Date(),
      };

      const assistantMsg: UIMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setTimeout(() => scrollToBottom(true), 40);

      try {
        const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
        const userApiKey = getStoredApiKey();

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userApiKey ? { 'x-nvidia-api-key': userApiKey } : {}),
          },
          body: JSON.stringify({
            question,
            conversationId: activeConvId || undefined,
            modelId: selectedModel,
            apiKey: userApiKey || undefined,
            history,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? {
                    ...m,
                    isStreaming: false,
                    error: data.error ?? 'An error occurred. Please try again.',
                  }
                : m
            )
          );
          return;
        }

        const resolvedConvId = data.conversationId || activeConvId || `conv-${Date.now()}`;
        if (!activeConvId) {
          setActiveConvId(resolvedConvId);
          onConversationStart(resolvedConvId);
        }

        const newAssistantMsg: UIMessage = {
          ...assistantMsg,
          content: data.answer,
          sources: data.sources,
          modelUsed: data.modelUsed,
          isStreaming: false,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? newAssistantMsg : m))
        );
        setTimeout(() => scrollToBottom(true), 50);
        setTimeout(() => scrollToBottom(true), 160);

        // Persist to local store for Chat History
        const allMsgs = [...messages, userMsg, newAssistantMsg];
        saveStoredConversation({
          id: resolvedConvId,
          title: question.slice(0, 50) + (question.length > 50 ? '…' : ''),
          model_used: data.modelUsed || selectedModel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: allMsgs.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
            sources: m.sources,
            modelUsed: m.modelUsed,
          })),
        });

        onSourcesUpdateRef.current(data.sources ?? [], data.relatedQuestions ?? []);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  isStreaming: false,
                  error: 'Network error. Please check your connection.',
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, activeConvId, selectedModel, onConversationStart, scrollToBottom]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="floating-main" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* ── Scrollable Chat Flow (No unsightly scrollbars, no welcome box) ── */}
      <div
        ref={scrollContainerRef}
        className="chat-scroll-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          padding: '20px 24px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* Minimal Empty State if no messages */}
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '60px 20px',
              minHeight: 280,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Sparkles size={24} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>KnowSphere AI</h2>
            <p style={{ fontSize: 13, color: '#64748b', maxWidth: 420, lineHeight: 1.55, margin: 0 }}>
              Ask any question about company SOPs, refund policies, equipment allowances, or pricing rules.
            </p>
          </div>
        )}

        {/* ── Messages Stream ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', minWidth: 0 }}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                {/* User Message Row */}
                {isUser ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                      gap: 10,
                      maxWidth: '82%',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}>
                      <div
                        style={{
                          background: '#dbeafe',
                          color: '#1e3a8a',
                          borderRadius: '18px 18px 4px 18px',
                          padding: '10px 16px',
                          fontSize: 13.5,
                          fontWeight: 500,
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>
                      <span
                        suppressHydrationWarning
                        style={{
                          fontSize: 10.5,
                          color: '#94a3b8',
                          marginTop: 3,
                          marginRight: 4,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {msg.id.startsWith('demo-')
                          ? '10:24 AM'
                          : mounted
                          ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '10:24 AM'}
                      </span>
                    </div>

                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0,
                      }}
                    >
                      <UserIcon size={16} color="#ffffff" />
                    </div>
                  </div>
                ) : (
                  /* Assistant Message Row */
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', minWidth: 0 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <KnowSphereLogo size={28} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 40px)' }}>
                      {/* Top Action Icons (Copy, ThumbsUp, ThumbsDown) */}
                      {!msg.isStreaming && !msg.error && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 4,
                            marginBottom: 4,
                          }}
                        >
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ padding: 4 }}
                            onClick={() => handleCopy(msg.content, msg.id)}
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#64748b" />}
                          </button>
                          <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} title="Helpful">
                            <ThumbsUp size={14} color="#64748b" />
                          </button>
                          <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} title="Not helpful">
                            <ThumbsDown size={14} color="#64748b" />
                          </button>
                        </div>
                      )}

                      {/* Content text */}
                      {msg.isStreaming ? (
                        <div style={{ display: 'flex', gap: 5, padding: '8px 0' }}>
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      ) : msg.error ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
                            <AlertCircle size={15} />
                            <span style={{ fontSize: 13 }}>{msg.error}</span>
                          </div>
                          {msg.error.toLowerCase().includes('api key') && (
                            <button
                              type="button"
                              onClick={() => setApiKeyModalOpen(true)}
                              className="btn btn-primary"
                              style={{ width: 'fit-content', padding: '6px 12px', fontSize: 12, borderRadius: 8, marginTop: 4 }}
                            >
                              Insert NVIDIA API Key 🔑
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#1e293b', minWidth: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      )}

                      {/* Embedded Citation Card */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: 14,
                            background: 'rgba(255, 255, 255, 0.75)',
                            border: '1px solid rgba(226, 232, 240, 0.9)',
                            marginTop: 14,
                            gap: 14,
                            width: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                background: '#fee2e2',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 9,
                                fontWeight: 800,
                              }}
                            >
                              PDF
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                {msg.sources[0].filename}
                              </p>
                              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                                Page {msg.sources[0].pageNumber ?? 1} · Verified Source
                              </p>
                            </div>
                          </div>

                          <p
                            style={{
                              fontSize: 12,
                              color: '#64748b',
                              fontStyle: 'italic',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0,
                              margin: 0,
                            }}
                          >
                            &ldquo;{msg.sources[0].excerpt}&rdquo;
                          </p>

                          <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                        </div>
                      )}

                      {/* Assistant Timestamp */}
                      <span
                        suppressHydrationWarning
                        style={{
                          display: 'block',
                          fontSize: 10.5,
                          color: '#94a3b8',
                          marginTop: 6,
                          marginLeft: 2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {msg.id.startsWith('demo-')
                          ? '10:24 AM'
                          : mounted
                          ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '10:24 AM'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Floating Capsule Composer ─────────────────────────────────── */}
      <div style={{ padding: '0 20px 14px', zIndex: 10, width: '100%', boxSizing: 'border-box' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
            padding: '6px 12px 8px',
          }}
        >
          {/* Text Area with Inter typography */}
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your company documents…"
            rows={1}
            disabled={isLoading}
            style={{
              width: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              padding: '6px 4px 6px',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              lineHeight: 1.55,
              background: 'transparent',
              color: '#0f172a',
              overflowY: 'hidden',
            }}
          />

          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            {/* Left Tools */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Web Search Toggle Switch */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 2px' }}
                onClick={() => setWebSearchEnabled((v) => !v)}
              >
                <div
                  style={{
                    width: 32,
                    height: 18,
                    borderRadius: 9,
                    background: webSearchEnabled ? '#2563eb' : '#cbd5e1',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 2,
                      left: webSearchEnabled ? 16 : 2,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>Web Search</span>
              </div>
            </div>

            {/* Right Tools: Model selector pill & Circular send button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ModelSelector selectedModel={selectedModel} onSelect={onModelSelect} compact />

              <button
                id="send-btn"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                  opacity: input.trim() && !isLoading ? 1 : 0.6,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                {isLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} style={{ transform: 'translateX(1px)' }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NVIDIA API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />
    </div>
  );
}
