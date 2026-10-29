'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database, Settings, LayoutDashboard, SlidersHorizontal,
  Clock, ChevronRight, Sparkles, Box, MessageSquarePlus,
} from 'lucide-react';
import { getDashboardStats } from '@/lib/store';

interface SidebarProps {
  documentCount?: number;
  chunkCount?: number;
  onNewChat?: () => void;
}

const navItems = [
  { href: '/knowledge', label: 'Knowledge Base', icon: Box, id: 'nav-knowledge' },
  { href: '/history', label: 'Chat History', icon: Clock, id: 'nav-history' },
  { href: '/model-settings', label: 'Model Settings', icon: SlidersHorizontal, id: 'nav-model-settings' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, id: 'nav-dashboard' },
  { href: '/settings', label: 'Settings', icon: Settings, id: 'nav-settings' },
];

export default function Sidebar({ documentCount, chunkCount, onNewChat }: SidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ docs: 0, chunks: 0 });

  useEffect(() => {
    const update = () => {
      const stats = getDashboardStats();
      setCounts({ docs: stats.totalDocuments, chunks: stats.totalChunks });
    };
    update();
    window.addEventListener('knowsphere_docs_updated', update);
    window.addEventListener('knowsphere_mode_changed', update);
    return () => {
      window.removeEventListener('knowsphere_docs_updated', update);
      window.removeEventListener('knowsphere_mode_changed', update);
    };
  }, []);

  const effectiveDocs = documentCount !== undefined ? documentCount : counts.docs;
  const effectiveChunks = chunkCount !== undefined ? chunkCount : counts.chunks;

  return (
    <aside className="floating-sidebar">
      {/* New Chat Primary CTA */}
      <button
        id="nav-new-chat"
        className="new-chat-btn"
        onClick={onNewChat}
        aria-label="Start a new chat"
      >
        <MessageSquarePlus size={18} strokeWidth={2.2} />
        <span>New Chat</span>
      </button>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginTop: 6 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              id={item.id}
              href={item.href}
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} strokeWidth={1.9} color={isActive ? '#2563eb' : '#475569'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Documents Storage Metric Card */}
      <Link href="/knowledge" style={{ textDecoration: 'none' }}>
        <div
          className="card-glass card-hover"
          style={{
            padding: '11px 13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Database size={15} color="#2563eb" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {effectiveDocs} {effectiveDocs === 1 ? 'Document' : 'Documents'}
              </p>
              <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.2, marginTop: 1 }}>
                {effectiveChunks.toLocaleString()} chunks
              </p>
            </div>
          </div>
          <ChevronRight size={14} color="#94a3b8" />
        </div>
      </Link>

      {/* Need Help Card */}
      <div
        style={{
          padding: '13px 14px',
          borderRadius: 18,
          background: 'rgba(240, 246, 255, 0.85)',
          border: '1px solid rgba(219, 234, 254, 0.9)',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <Sparkles size={14} color="#2563eb" />
          <p style={{ fontSize: 12.5, fontWeight: 700, color: '#1e3a8a' }}>Need help?</p>
        </div>
        <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.45 }}>
          Ask me anything about your company documents.
        </p>
      </div>
    </aside>
  );
}
