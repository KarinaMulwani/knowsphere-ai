# KnowSphere AI — Internal Company Knowledge Assistant

A production-quality, AI-powered internal knowledge base system. Upload company documents and get instant, cited answers using **Retrieval-Augmented Generation (RAG)** powered by **NVIDIA NIM** and **Supabase pgvector**.

---

## Architecture Overview

```
User Question
     │
     ▼
[Next.js API /api/chat]
     │
     ├─► generateEmbedding(question) ──► NVIDIA NIM (embedding model)
     │
     ├─► match_chunks(query_embedding) ──► Supabase pgvector (cosine similarity)
     │
     ├─► buildSystemPrompt(retrieved_chunks)
     │
     └─► runRagChat(question, sources) ──► NVIDIA NIM (chat model + fallback)
                                                  │
                                             Answer + Citations
                                                  │
                                         Store in Supabase messages
                                                  │
                                          Return to browser UI
```

**Core pipeline:**  
`Upload → Extract text → Chunk → Embed → Store vectors → Retrieve → Generate answer → Cite sources`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + custom CSS design system |
| LLM Inference | NVIDIA NIM (OpenAI-compatible) |
| Embeddings | NVIDIA NIM embedding model |
| Database | Supabase PostgreSQL + pgvector |
| Validation | Zod |
| Icons | Lucide React |
| PDF parsing | pdf-parse |
| DOCX parsing | mammoth |

---

## Features

- ✅ **Chat with citations** — RAG-grounded answers with document, page, and excerpt references
- ✅ **Document upload** — PDF, TXT, Markdown, DOCX (up to 20 MB)
- ✅ **Text extraction** — With graceful handling of scanned/corrupted PDFs
- ✅ **Chunking & embeddings** — Configurable chunk size and overlap
- ✅ **Vector similarity search** — pgvector cosine distance
- ✅ **Model fallback** — Automatic fallback across NVIDIA models on errors
- ✅ **Conversation history** — Persisted in Supabase
- ✅ **Dashboard** — Real database statistics
- ✅ **Model settings** — Configurable chat and embedding models
- ✅ **Security** — Server-side only API keys, RLS policies, Zod validation
- ✅ **Responsive design** — Desktop, tablet, and mobile layouts

---

## Prerequisites

- Node.js 18+
- npm 9+
- A free [NVIDIA Developer account](https://build.nvidia.com) for NIM API access
- A free [Supabase account](https://supabase.com) for the database

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase → Settings → API |
| `NVIDIA_API_KEY` | NVIDIA NIM API key | [build.nvidia.com](https://build.nvidia.com) |
| `NVIDIA_PRIMARY_MODEL` | Primary chat model | See `src/lib/config.ts` |
| `NVIDIA_EMBEDDING_MODEL` | Embedding model | See `src/lib/config.ts` |
| `NVIDIA_EMBEDDING_DIMENSION` | Embedding dimension | Must match migration |

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Database → Extensions** and enable `vector`
3. Go to **SQL Editor** and run the migration:

```sql
-- Paste the contents of supabase/migrations/001_initial_schema.sql
```

Or, if you have the Supabase CLI:
```bash
npx supabase db push
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables Reference

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NVIDIA_API_KEY=nvapi-your-key

# Optional (sensible defaults in src/lib/config.ts)
NVIDIA_PRIMARY_MODEL=meta/llama-3.1-70b-instruct
NVIDIA_FALLBACK_MODEL=meta/llama-3.1-8b-instruct
NVIDIA_FALLBACK_MODEL_2=nvidia/llama-3.1-nemotron-51b-instruct
NVIDIA_EMBEDDING_MODEL=nvidia/nv-embedqa-e5-v5
NVIDIA_EMBEDDING_DIMENSION=1024
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.3
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # RAG chat endpoint
│   │   ├── upload/route.ts        # Document upload & processing
│   │   ├── documents/route.ts     # Document list & delete
│   │   ├── conversations/
│   │   │   ├── route.ts           # List conversations
│   │   │   └── [id]/messages/     # Get conversation messages
│   │   ├── dashboard/route.ts     # Stats endpoint
│   │   └── models/route.ts        # Model registry endpoint
│   ├── knowledge/page.tsx         # Knowledge base page
│   ├── history/page.tsx           # Chat history page
│   ├── dashboard/page.tsx         # Dashboard page
│   ├── model-settings/page.tsx    # Model settings page
│   ├── settings/page.tsx          # App settings page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main chat page
│   └── globals.css                # Design system CSS
├── components/
│   ├── ChatWorkspace.tsx          # Main chat interface
│   ├── SourcesPanel.tsx           # Sources & related questions
│   ├── Sidebar.tsx                # Left navigation
│   ├── TopNav.tsx                 # Top navigation bar
│   └── ModelSelector.tsx          # NVIDIA model picker
└── lib/
    ├── config.ts                  # Model registry & all config
    ├── types.ts                   # TypeScript types
    ├── supabase.ts                # Database client
    ├── embeddings.ts              # NVIDIA embedding generation
    ├── extraction.ts              # Document text extraction
    ├── chunking.ts                # Text chunking utilities
    └── llm.ts                     # LLM client with fallback
supabase/
└── migrations/
    └── 001_initial_schema.sql     # Full DB schema
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload and process a document |
| `POST` | `/api/chat` | RAG-grounded chat completion |
| `GET` | `/api/documents` | List all documents |
| `DELETE` | `/api/documents?id=` | Delete a document + chunks |
| `GET` | `/api/conversations` | List conversations |
| `GET` | `/api/conversations/[id]/messages` | Get conversation messages |
| `GET` | `/api/dashboard` | Dashboard statistics |
| `GET` | `/api/models` | Available models |

---

## Adding New Models

Edit `src/lib/config.ts` → `CHAT_MODELS` array. Add a new entry and update `FALLBACK_ORDER` if needed. No other changes required.

---

## Security Notes

- `NVIDIA_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are **server-side only** — never exposed to the browser
- All API routes use parameterised database queries via the Supabase client
- Uploaded document content is treated as untrusted — the system prompt explicitly instructs the LLM to ignore override attempts in document content
- Row Level Security (RLS) is enabled on all tables with service-role bypass policies (suitable for single-tenant demo; extend with user-scoped policies for multi-tenant production)

---

## Future Deployment (GitHub + Vercel)

> Not needed for local development. This section is for reference only.

1. Push to a GitHub repository
2. Import the repository in [Vercel](https://vercel.com)
3. Set all environment variables in Vercel project settings
4. Deploy — Vercel auto-detects Next.js and builds correctly

---

## License

MIT — Built for internship assessment purposes.
