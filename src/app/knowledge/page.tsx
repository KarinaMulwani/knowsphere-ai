'use client';

import { useState, useEffect, useRef } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import {
  Upload, Trash2, Search, RefreshCw, FileText, CheckCircle,
  XCircle, Clock, AlertCircle, Database, Filter, X, Sparkles, Plus
} from 'lucide-react';
import { DEFAULT_MODEL_ID } from '@/lib/config';
import { getStoredApiKey } from '@/lib/apiKey';
import {
  getStoredDocuments,
  addStoredDocument,
  deleteStoredDocument,
  getAppMode,
  setAppMode,
  type AppMode,
} from '@/lib/store';
import type { Document, FileType } from '@/lib/types';

const statusConfig = {
  indexed:    { label: 'Indexed', badgeClass: 'badge-success', icon: CheckCircle, color: 'var(--color-success)' },
  processing: { label: 'Processing', badgeClass: 'badge-warning', icon: RefreshCw, color: 'var(--color-warning)' },
  pending:    { label: 'Pending', badgeClass: 'badge-neutral', icon: Clock, color: 'var(--color-text-tertiary)' },
  failed:     { label: 'Failed', badgeClass: 'badge-error', icon: XCircle, color: 'var(--color-error)' },
};

const ftColors: Record<string, { bg: string; color: string }> = {
  pdf:  { bg: '#fee2e2', color: '#b91c1c' },
  docx: { bg: '#dbeafe', color: '#1d4ed8' },
  txt:  { bg: '#f3f4f6', color: '#374151' },
  md:   { bg: '#d1fae5', color: '#065f46' },
};

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function KnowledgePage() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [appMode, setAppModeState] = useState<AppMode>('demo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const syncDocuments = async () => {
    const mode = getAppMode();
    setAppModeState(mode);
    const stored = getStoredDocuments();
    setDocuments(stored);
    setLoading(false);

    // Also attempt remote fetch if available
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        if (data.documents && data.documents.length > 0) {
          const storedIds = new Set(stored.map((d) => d.id));
          const remoteOnly = data.documents.filter((d: Document) => !storedIds.has(d.id));
          if (remoteOnly.length > 0) {
            setDocuments([...stored, ...remoteOnly]);
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    syncDocuments();

    const handleUpdate = () => syncDocuments();
    window.addEventListener('knowsphere_docs_updated', handleUpdate);
    window.addEventListener('knowsphere_mode_changed', handleUpdate);

    return () => {
      window.removeEventListener('knowsphere_docs_updated', handleUpdate);
      window.removeEventListener('knowsphere_mode_changed', handleUpdate);
    };
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSuccessMsg(null);
    setUploading(true);

    const userApiKey = getStoredApiKey();

    for (const file of Array.from(files)) {
      setUploadProgress(`Processing ${file.name}…`);

      // Determine file extension
      const rawExt = file.name.split('.').pop()?.toLowerCase();
      const ext: FileType = rawExt === 'pdf' || rawExt === 'docx' || rawExt === 'md' ? rawExt : 'txt';
      const chunkCount = Math.max(1, Math.ceil(file.size / 1024));

      // Create local document record
      const newDoc: Document = {
        id: 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        filename: file.name,
        file_type: ext,
        file_size: file.size,
        status: 'indexed',
        chunk_count: chunkCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to dynamic store immediately
      addStoredDocument(newDoc);

      // Attempt remote upload if server API is reachable
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (userApiKey) formData.append('apiKey', userApiKey);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: userApiKey ? { 'x-nvidia-api-key': userApiKey } : undefined,
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.document?.id) {
            // Replace temporary ID with persisted ID if available
            deleteStoredDocument(newDoc.id);
            addStoredDocument({ ...newDoc, id: data.document.id, chunk_count: data.chunksCount || chunkCount });
          }
        }
      } catch {
        // Local mode will continue to serve knowledge
      }
    }

    setUploading(false);
    setUploadProgress(null);
    setSuccessMsg(`Successfully uploaded and indexed ${files.length} document${files.length > 1 ? 's' : ''}`);
    setTimeout(() => setSuccessMsg(null), 4000);
    syncDocuments();
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.filename}" from the knowledge base?`)) return;
    setDeletingId(doc.id);
    deleteStoredDocument(doc.id);

    try {
      await fetch(`/api/documents?id=${doc.id}`, { method: 'DELETE' });
    } catch {}

    setDeletingId(null);
    syncDocuments();
  };

  // Drag and drop
  useEffect(() => {
    const dz = dropZoneRef.current;
    if (!dz) return;
    const onDrag = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onLeave = () => setIsDragging(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleUpload(e.dataTransfer?.files ?? null);
    };
    dz.addEventListener('dragover', onDrag);
    dz.addEventListener('dragleave', onLeave);
    dz.addEventListener('drop', onDrop);
    return () => {
      dz.removeEventListener('dragover', onDrag);
      dz.removeEventListener('dragleave', onLeave);
      dz.removeEventListener('drop', onDrop);
    };
  }, []);

  const filtered = documents.filter((d) => {
    const matchSearch = d.filename.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: documents.length,
    indexed: documents.filter((d) => d.status === 'indexed').length,
    processing: documents.filter((d) => d.status === 'processing' || d.status === 'pending').length,
    failed: documents.filter((d) => d.status === 'failed').length,
    chunks: documents.reduce((sum, d) => sum + (d.chunk_count ?? 1), 0),
  };

  return (
    <div className="app-shell">
      <TopNav selectedModel={selectedModel} onModelSelect={setSelectedModel} />
      <div className="app-body">
        <Sidebar documentCount={stats.indexed} chunkCount={stats.chunks} />
        <main className="floating-main" style={{ overflowY: 'auto', padding: '28px 32px' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Knowledge Base</h1>
                <span
                  className="badge badge-neutral"
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 700,
                  }}
                >
                  {appMode === 'demo' ? '✨ Demo Data' : '🧹 Clean Start'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Upload, search, and manage approved company documents. Supported formats: PDF, TXT, Markdown, DOCX.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAppMode(appMode === 'demo' ? 'clean' : 'demo')}
                title="Switch between pre-loaded demo documents and clean start"
              >
                {appMode === 'demo' ? '🧹 Switch to Clean Start' : '✨ Load Demo Documents'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Documents', value: stats.total, color: 'var(--color-accent)', icon: Database },
              { label: 'Indexed', value: stats.indexed, color: 'var(--color-success)', icon: CheckCircle },
              { label: 'Total Chunks', value: stats.chunks.toLocaleString(), color: 'var(--color-purple)', icon: FileText },
              { label: 'Failed', value: stats.failed, color: 'var(--color-error)', icon: XCircle },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                    <Icon size={15} color={s.color} />
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* Upload zone */}
          <div
            ref={dropZoneRef}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '30px',
              textAlign: 'center',
              marginBottom: 24,
              background: isDragging ? 'var(--color-accent-light)' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              id="file-upload-input"
              type="file"
              accept=".pdf,.txt,.md,.mdx,.docx"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleUpload(e.target.files)}
            />
            <div style={{
              width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
              background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {uploading
                ? <RefreshCw size={22} color="var(--color-accent)" className="animate-spin" />
                : <Upload size={22} color="var(--color-accent)" />
              }
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>
              {uploading ? uploadProgress ?? 'Processing…' : 'Drop company files here or click to upload'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              PDF, TXT, Markdown, DOCX · Max 20 MB per file · Real-time indexing
            </p>
          </div>

          {/* Notifications */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'var(--color-error-light)', border: '1px solid #fca5a5',
              borderRadius: 'var(--radius-md)', marginBottom: 16,
            }}>
              <AlertCircle size={14} color="var(--color-error)" />
              <span style={{ fontSize: 13, color: 'var(--color-error)', flex: 1 }}>{error}</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setError(null)}><X size={13} /></button>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'var(--color-success-light)', border: '1px solid #86efac',
              borderRadius: 'var(--radius-md)', marginBottom: 16,
            }}>
              <CheckCircle size={14} color="var(--color-success)" />
              <span style={{ fontSize: 13, color: '#15803d', flex: 1 }}>{successMsg}</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSuccessMsg(null)}><X size={13} /></button>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input
                id="doc-search"
                type="text"
                placeholder="Search documents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 12px 7px 30px', fontSize: 13 }}
              />
            </div>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '7px 12px', fontSize: 13, borderRadius: 'var(--radius-md)' }}
            >
              <option value="all">All statuses</option>
              <option value="indexed">Indexed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button id="refresh-docs-btn" className="btn btn-secondary btn-sm" onClick={syncDocuments}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {/* Documents list */}
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {loading ? (
              <div style={{ padding: 24 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 11, width: '25%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Database size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  {appMode === 'clean' ? 'No documents (Clean Start Mode)' : 'No documents found'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
                  {appMode === 'clean'
                    ? 'Upload your company documents above, or click "Load Demo Documents" to preview approved SOPs and policies.'
                    : 'Upload your first document or reset search filters.'}
                </p>
                {appMode === 'clean' && (
                  <button className="btn btn-primary btn-sm" onClick={() => setAppMode('demo')}>
                    <Sparkles size={13} /> Load Demo Documents
                  </button>
                )}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Document', 'Type', 'Size', 'Chunks', 'Status', 'Uploaded', ''].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => {
                    const sc = statusConfig[doc.status] || statusConfig.indexed;
                    const Icon = sc.icon;
                    const ft = ftColors[doc.file_type] ?? ftColors.txt;
                    return (
                      <tr
                        key={doc.id}
                        style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 246, 255, 0.4)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: ft.bg, color: ft.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>
                              {doc.file_type.toUpperCase()}
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                              {doc.filename}
                            </p>
                          </div>
                          {doc.status === 'failed' && doc.error_msg && (
                            <p style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2, paddingLeft: 42 }}>{doc.error_msg.slice(0, 80)}</p>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: 10 }}>{doc.file_type.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {formatSize(doc.file_size)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                          {doc.chunk_count > 0 ? doc.chunk_count : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge ${sc.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon size={10} className={doc.status === 'processing' ? 'animate-spin' : ''} />
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            aria-label={`Delete ${doc.filename}`}
                            title="Delete document"
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
                            {deletingId === doc.id
                              ? <RefreshCw size={13} className="animate-spin" />
                              : <Trash2 size={13} />
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
