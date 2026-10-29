// =============================================================================
// GET /api/documents — List all documents
// DELETE /api/documents — Delete a document by ID
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('documents')
      .select('id, filename, file_type, file_size, status, error_msg, chunk_count, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[KnowSphere] Documents query warning:', error.message);
      return NextResponse.json({ documents: [], error: error.message });
    }

    return NextResponse.json({ documents: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[KnowSphere] Documents fetch (unconfigured DB):', msg);
    return NextResponse.json({ documents: [], configured: false, warning: msg });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  }

  // Validate ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid document ID format' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Chunks are deleted automatically via CASCADE
  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deletedId: id });
}
