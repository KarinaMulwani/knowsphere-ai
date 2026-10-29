// =============================================================================
// POST /api/chat — RAG-grounded chat completions with dynamic NVIDIA API Key
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';
import { runRagChat } from '@/lib/llm';
import { RAG_CONFIG, DEFAULT_MODEL_ID } from '@/lib/config';
import { searchBuiltInKnowledge } from '@/lib/knowledgeBase';
import { v4 as uuidv4 } from 'uuid';
import type { Source } from '@/lib/types';

const ChatRequestSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000, 'Question too long'),
  conversationId: z.string().uuid().nullable().optional(),
  modelId: z.string().nullable().optional(),
  apiKey: z.string().nullable().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(20)
    .optional(),
});

export async function POST(req: NextRequest) {
  // ── Parse and validate ─────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 }
    );
  }

  const { question, conversationId, modelId, apiKey: bodyApiKey, history } = parsed.data;

  // Resolve API Key: Priority = Body API Key > Header > process.env
  const effectiveApiKey =
    bodyApiKey?.trim() ||
    req.headers.get('x-nvidia-api-key')?.trim() ||
    process.env.NVIDIA_API_KEY;

  if (!effectiveApiKey) {
    return NextResponse.json(
      {
        error:
          'NVIDIA API Key is missing. Please insert your API key using the "API Key" button in the header or in Settings.',
      },
      { status: 401 }
    );
  }

  try {
    let sources: Source[] = [];

    // ── Check if Supabase is configured for vector search ─────────────────────
    const hasSupabase = isSupabaseConfigured();

    if (hasSupabase) {
      try {
        const supabase = getAdminClient();
        // Generate query embedding with effective API key
        const queryEmbedding = await generateEmbedding(question, effectiveApiKey);

        // Retrieve relevant chunks
        const { data: chunks, error: retrievalErr } = await supabase.rpc('match_chunks', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: RAG_CONFIG.similarityThreshold,
          match_count: RAG_CONFIG.topK,
          filter_user_id: null,
        });

        if (!retrievalErr && chunks) {
          sources = chunks.map((c: {
            id: string; document_id: string; filename: string; file_type: string;
            page_number?: number; content: string; similarity: number; chunk_index: number;
          }) => ({
            chunkId: c.id,
            documentId: c.document_id,
            filename: c.filename,
            fileType: c.file_type,
            pageNumber: c.page_number,
            excerpt: c.content.slice(0, 300) + (c.content.length > 300 ? '…' : ''),
            similarity: Math.round(c.similarity * 100) / 100,
            chunkIndex: c.chunk_index,
          }));
        }
      } catch (embOrDbErr) {
        console.warn('[KnowSphere] Vector retrieval note:', embOrDbErr);
      }
    }

    // ── Fall back to approved company knowledge base if no vector chunks retrieved ─
    if (sources.length === 0) {
      const builtInSources = searchBuiltInKnowledge(question, RAG_CONFIG.topK);
      if (builtInSources.length > 0) {
        sources = builtInSources;
      }
    }

    // ── Run LLM inference with effective API key ───────────────────────────────
    const result = await runRagChat(
      question,
      sources,
      modelId ?? DEFAULT_MODEL_ID,
      history ?? [],
      effectiveApiKey
    );

    // ── Persist conversation and messages if Supabase connected ───────────────
    let activeConversationId = conversationId || uuidv4();

    if (hasSupabase) {
      try {
        const supabase = getAdminClient();
        if (!conversationId) {
          const title = question.slice(0, 60) + (question.length > 60 ? '…' : '');
          const { data: conv } = await supabase
            .from('conversations')
            .insert({ title, model_used: result.modelUsed })
            .select()
            .single();

          if (conv) activeConversationId = conv.id;
        }

        await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          role: 'user',
          content: question,
        });

        await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: result.content,
          sources: result.sources,
          model_used: result.modelUsed,
        });
      } catch (dbSaveErr) {
        console.warn('[KnowSphere] DB save note:', dbSaveErr);
      }
    }

    return NextResponse.json({
      answer: result.content,
      sources: result.sources,
      relatedQuestions: result.relatedQuestions,
      modelUsed: result.modelUsed,
      conversationId: activeConversationId,
      messageId: uuidv4(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[KnowSphere] Chat error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
