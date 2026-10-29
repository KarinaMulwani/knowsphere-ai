// =============================================================================
// GET /api/dashboard — Dashboard statistics from real database data
// =============================================================================

import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import type { DashboardStats } from '@/lib/types';

export async function GET() {
  try {
    const supabase = getAdminClient();

    const [docsResult, chunksResult, convsResult] = await Promise.all([
      supabase.from('documents').select('id, status', { count: 'exact' }),
      supabase.from('document_chunks').select('id', { count: 'exact' }),
      supabase.from('conversations').select('id', { count: 'exact' }),
    ]);

    if (docsResult.error) {
      console.warn('[KnowSphere] Dashboard query warning:', docsResult.error.message);
      return NextResponse.json({
        totalDocuments: 0,
        indexedDocuments: 0,
        processingDocuments: 0,
        failedDocuments: 0,
        totalChunks: 0,
        totalConversations: 0,
        warning: docsResult.error.message,
      });
    }

    const docs = docsResult.data ?? [];
    const stats: DashboardStats = {
      totalDocuments: docsResult.count ?? docs.length,
      indexedDocuments: docs.filter((d) => d.status === 'indexed').length,
      processingDocuments: docs.filter((d) => d.status === 'processing' || d.status === 'pending').length,
      failedDocuments: docs.filter((d) => d.status === 'failed').length,
      totalChunks: chunksResult.count ?? 0,
      totalConversations: convsResult.count ?? 0,
    };

    return NextResponse.json(stats);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[KnowSphere] Dashboard fetch (unconfigured DB):', msg);
    return NextResponse.json({
      totalDocuments: 0,
      indexedDocuments: 0,
      processingDocuments: 0,
      failedDocuments: 0,
      totalChunks: 0,
      totalConversations: 0,
      configured: false,
    });
  }
}
