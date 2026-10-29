// =============================================================================
// GET /api/models — List available chat models from the registry
// =============================================================================

import { NextResponse } from 'next/server';
import { CHAT_MODELS, DEFAULT_MODEL_ID, EMBEDDING_CONFIG } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    models: CHAT_MODELS,
    defaultModelId: DEFAULT_MODEL_ID,
    embeddingModel: EMBEDDING_CONFIG.model,
    embeddingDimension: EMBEDDING_CONFIG.dimension,
  });
}
