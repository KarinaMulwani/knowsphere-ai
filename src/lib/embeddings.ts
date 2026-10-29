// =============================================================================
// KnowSphere AI - Embedding generation via NVIDIA NIM
// =============================================================================

import OpenAI from 'openai';
import { EMBEDDING_CONFIG, NVIDIA_BASE_URL } from './config';

let defaultEmbeddingClient: OpenAI | null = null;

function getEmbeddingClient(customApiKey?: string): OpenAI {
  const apiKey = customApiKey?.trim() || process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'NVIDIA API Key is missing. Please enter your API key in Settings or configure NVIDIA_API_KEY in .env.local.'
    );
  }

  // If custom key provided, create dedicated client
  if (customApiKey?.trim()) {
    return new OpenAI({
      apiKey: customApiKey.trim(),
      baseURL: NVIDIA_BASE_URL,
      timeout: 30_000,
    });
  }

  if (defaultEmbeddingClient) return defaultEmbeddingClient;

  defaultEmbeddingClient = new OpenAI({
    apiKey,
    baseURL: NVIDIA_BASE_URL,
    timeout: 30_000,
  });

  return defaultEmbeddingClient;
}

/**
 * Generate an embedding vector for a single text string.
 * Returns a number array of length EMBEDDING_CONFIG.dimension.
 */
export async function generateEmbedding(text: string, customApiKey?: string): Promise<number[]> {
  const client = getEmbeddingClient(customApiKey);

  const response = await client.embeddings.create({
    model: EMBEDDING_CONFIG.model,
    input: text.slice(0, 8192), // safety: NVIDIA models typically have 8k token input limit
    encoding_format: 'float',
  });

  const embedding = response.data[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error('Empty embedding returned from NVIDIA API');
  }

  // Validate dimension
  if (embedding.length !== EMBEDDING_CONFIG.dimension) {
    throw new Error(
      `Embedding dimension mismatch: got ${embedding.length}, expected ${EMBEDDING_CONFIG.dimension}. ` +
        'Check NVIDIA_EMBEDDING_MODEL and NVIDIA_EMBEDDING_DIMENSION in .env.local'
    );
  }

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batches.
 * NVIDIA NIM supports batch embedding requests.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize = 10,
  customApiKey?: string
): Promise<number[][]> {
  const client = getEmbeddingClient(customApiKey);
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8192));

    const response = await client.embeddings.create({
      model: EMBEDDING_CONFIG.model,
      input: batch,
      encoding_format: 'float',
    });

    // Sort by index to preserve order
    const sorted = response.data.sort((a, b) => a.index - b.index);
    for (const item of sorted) {
      const emb = item.embedding;
      if (emb.length !== EMBEDDING_CONFIG.dimension) {
        throw new Error(
          `Embedding dimension mismatch in batch item: got ${emb.length}, expected ${EMBEDDING_CONFIG.dimension}`
        );
      }
      results.push(emb);
    }
  }

  return results;
}
