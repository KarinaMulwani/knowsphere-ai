-- =============================================================================
-- KnowSphere AI - Supabase Migration
-- Run this in your Supabase SQL Editor (Database → SQL Editor → New Query)
-- =============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Documents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,                          -- nullable for single-tenant demo
  filename    TEXT NOT NULL,
  file_type   TEXT NOT NULL,                 -- 'pdf', 'txt', 'md', 'docx'
  file_size   BIGINT NOT NULL,               -- bytes
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | indexed | failed
  error_msg   TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Document Chunks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,            -- 0-based order within document
  content       TEXT NOT NULL,               -- raw chunk text
  page_number   INTEGER,                     -- PDF page, null for flat text
  embedding     VECTOR(1024),               -- must match NVIDIA_EMBEDDING_DIMENSION
  token_count   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Conversations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  title       TEXT NOT NULL DEFAULT 'New Chat',
  model_used  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Messages ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  sources          JSONB,                    -- array of {chunk_id, document_id, filename, page, excerpt, score}
  model_used       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────
-- Vector similarity search (IVFFlat - suitable for moderate-scale datasets)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id   ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_documents_status      ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id     ON documents (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user    ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC);

-- ── Vector similarity search function ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding  VECTOR(1024),
  match_threshold  FLOAT DEFAULT 0.3,
  match_count      INT   DEFAULT 5,
  filter_user_id   UUID  DEFAULT NULL
)
RETURNS TABLE (
  id            UUID,
  document_id   UUID,
  chunk_index   INTEGER,
  content       TEXT,
  page_number   INTEGER,
  similarity    FLOAT,
  filename      TEXT,
  file_type     TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.filename,
    d.file_type
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE
    d.status = 'indexed'
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── Row Level Security ─────────────────────────────────────────────────────────
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages         ENABLE ROW LEVEL SECURITY;

-- For single-tenant / demo mode: allow service role to bypass RLS.
-- In production with auth, replace with user-scoped policies.
CREATE POLICY "service_role_all_documents"
  ON documents FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_chunks"
  ON document_chunks FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_conversations"
  ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_messages"
  ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Trigger: updated_at ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
