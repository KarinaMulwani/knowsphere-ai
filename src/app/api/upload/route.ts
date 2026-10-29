// =============================================================================
// POST /api/upload — Upload and process a document
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminClient } from '@/lib/supabase';
import { extractText } from '@/lib/extraction';
import { chunkText, chunkTextWithPages } from '@/lib/chunking';
import { generateEmbeddingsBatch } from '@/lib/embeddings';
import { RAG_CONFIG } from '@/lib/config';
import type { FileType } from '@/lib/types';

const MAX_FILE_SIZE = RAG_CONFIG.maxFileSize;
const ALLOWED_EXTENSIONS = RAG_CONFIG.allowedExtensions;

function getFileType(filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  const map: Record<string, FileType> = {
    pdf: 'pdf', txt: 'txt', md: 'md', mdx: 'md', docx: 'docx', markdown: 'md',
  };
  return map[ext] ?? 'txt';
}

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();

  // ── Parse form data ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }

  // ── Insert document record (status: processing) ────────────────────────────
  const fileType = getFileType(file.name);
  const { data: doc, error: insertErr } = await supabase
    .from('documents')
    .insert({
      filename: file.name,
      file_type: fileType,
      file_size: file.size,
      status: 'processing',
    })
    .select()
    .single();

  if (insertErr || !doc) {
    return NextResponse.json(
      { error: `Database error: ${insertErr?.message ?? 'Unknown'}` },
      { status: 500 }
    );
  }

  const documentId: string = doc.id;

  try {
    // ── Extract text ─────────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractText(buffer, file.name, file.type);

    if (!extraction.hasContent) {
      const errorMsg = extraction.warnings.join(' ') || 'No extractable text found in document.';
      await supabase
        .from('documents')
        .update({ status: 'failed', error_msg: errorMsg })
        .eq('id', documentId);

      return NextResponse.json(
        { documentId, filename: file.name, status: 'failed', error: errorMsg },
        { status: 422 }
      );
    }

    // ── Chunk text ────────────────────────────────────────────────────────────
    const chunks =
      fileType === 'pdf'
        ? chunkTextWithPages(extraction.text, RAG_CONFIG.chunkSize, RAG_CONFIG.chunkOverlap)
        : chunkText(extraction.text, RAG_CONFIG.chunkSize, RAG_CONFIG.chunkOverlap);

    if (chunks.length === 0) {
      await supabase
        .from('documents')
        .update({ status: 'failed', error_msg: 'No text chunks generated.' })
        .eq('id', documentId);
      return NextResponse.json(
        { documentId, filename: file.name, status: 'failed', error: 'No text chunks generated.' },
        { status: 422 }
      );
    }

    // ── Generate embeddings ───────────────────────────────────────────────────
    const effectiveApiKey =
      (formData.get('apiKey') as string)?.trim() ||
      req.headers.get('x-nvidia-api-key')?.trim() ||
      process.env.NVIDIA_API_KEY;

    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddingsBatch(chunkTexts, 10, effectiveApiKey);

    // ── Store chunks ──────────────────────────────────────────────────────────
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      page_number: chunk.pageNumber ?? null,
      embedding: `[${embeddings[i].join(',')}]`, // pgvector expects array literal
      token_count: chunk.tokenCount,
    }));

    // Insert in batches of 50
    for (let i = 0; i < chunkRows.length; i += 50) {
      const batch = chunkRows.slice(i, i + 50);
      const { error: chunkErr } = await supabase.from('document_chunks').insert(batch);
      if (chunkErr) {
        throw new Error(`Failed to store chunks: ${chunkErr.message}`);
      }
    }

    // ── Mark document as indexed ──────────────────────────────────────────────
    await supabase
      .from('documents')
      .update({ status: 'indexed', chunk_count: chunks.length })
      .eq('id', documentId);

    return NextResponse.json({
      documentId,
      filename: file.name,
      status: 'indexed',
      chunkCount: chunks.length,
      warnings: extraction.warnings,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from('documents')
      .update({ status: 'failed', error_msg: msg })
      .eq('id', documentId);

    return NextResponse.json(
      { documentId, filename: file.name, status: 'failed', error: msg },
      { status: 500 }
    );
  }
}
