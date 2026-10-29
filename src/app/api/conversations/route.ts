// =============================================================================
// GET /api/conversations — List all conversations
// =============================================================================

import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, model_used, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[KnowSphere] Conversations query warning:', error.message);
      return NextResponse.json({ conversations: [], warning: error.message });
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[KnowSphere] Conversations fetch (unconfigured DB):', msg);
    return NextResponse.json({ conversations: [], configured: false });
  }
}
