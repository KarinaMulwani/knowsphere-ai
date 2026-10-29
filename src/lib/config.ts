// =============================================================================
// KnowSphere AI - Model Registry & Configuration
// Edit this file to add, remove, or reorder available chat models.
// =============================================================================

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: 'nvidia';
  description: string;
  contextLength: number;
  /** Use this model for fast, everyday queries */
  preferFast: boolean;
  /** Use this model for complex reasoning */
  preferReasoning: boolean;
}

/** Ordered list of chat models. First entry is the default primary model. */
export const CHAT_MODELS: ModelConfig[] = [
  {
    id: 'nvidia/nemotron-3.5-bolt-e4b',
    displayName: 'Nemotron 3.5 Bolt',
    provider: 'nvidia',
    description: "NVIDIA's premier high-accuracy enterprise instruction model.",
    contextLength: 131072,
    preferFast: true,
    preferReasoning: true,
  },
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    displayName: 'Gemma 26B IT',
    provider: 'nvidia',
    description: 'Advanced instruction-tuned reasoning model on NVIDIA NIM.',
    contextLength: 131072,
    preferFast: false,
    preferReasoning: true,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    displayName: 'Nemotron 3.5 Lightning',
    provider: 'nvidia',
    description: 'High-throughput 30B enterprise assistant.',
    contextLength: 131072,
    preferFast: true,
    preferReasoning: false,
  },
  {
    id: 'nvidia/riva-translate-4b-instruct-v2',
    displayName: 'Riva 4B Instruct',
    provider: 'nvidia',
    description: 'Lightweight, ultra-fast multilingual instruction assistant.',
    contextLength: 32768,
    preferFast: true,
    preferReasoning: false,
  },
];

/** Fallback order for transient and model errors. Must contain at least 2 entries. */
export const FALLBACK_ORDER: string[] = [
  process.env.NVIDIA_PRIMARY_MODEL  ?? 'nvidia/nemotron-3.5-bolt-e4b',
  process.env.NVIDIA_FALLBACK_MODEL ?? 'google/diffusiongemma-26b-a4b-it',
  process.env.NVIDIA_FALLBACK_MODEL_2 ?? 'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia/riva-translate-4b-instruct-v2',
];

export const DEFAULT_MODEL_ID =
  process.env.NVIDIA_PRIMARY_MODEL ?? 'nvidia/nemotron-3.5-bolt-e4b';

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/** Embedding model configuration (separate from chat models) */
export const EMBEDDING_CONFIG = {
  model: process.env.NVIDIA_EMBEDDING_MODEL ?? 'nvidia/nemotron-3.5-embed-1b',
  dimension: parseInt(process.env.NVIDIA_EMBEDDING_DIMENSION ?? '2048', 10),
  baseUrl: NVIDIA_BASE_URL,
};

/** RAG retrieval configuration */
export const RAG_CONFIG = {
  topK: parseInt(process.env.RAG_TOP_K ?? '5', 10),
  similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD ?? '0.3'),
  chunkSize: parseInt(process.env.CHUNK_SIZE ?? '1000', 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP ?? '200', 10),
  maxFileSize: 20 * 1024 * 1024, // 20 MB
  allowedTypes: ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedExtensions: ['.pdf', '.txt', '.md', '.mdx', '.docx'],
};

/** Request timeout in milliseconds */
export const REQUEST_TIMEOUT_MS = 60_000;
/** Maximum retry attempts before moving to the next fallback model */
export const MAX_RETRIES_PER_MODEL = 1;
