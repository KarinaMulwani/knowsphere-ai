// =============================================================================
// KnowSphere AI - TypeScript type definitions
// =============================================================================

export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed';
export type FileType = 'pdf' | 'txt' | 'md' | 'docx';
export type MessageRole = 'user' | 'assistant';

export interface Document {
  id: string;
  user_id?: string;
  filename: string;
  file_type: FileType;
  file_size: number;
  status: DocumentStatus;
  error_msg?: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_number?: number;
  token_count?: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id?: string;
  title: string;
  model_used?: string;
  created_at: string;
  updated_at: string;
}

export interface Source {
  chunkId: string;
  documentId: string;
  filename: string;
  fileType: string;
  pageNumber?: number;
  excerpt: string;
  similarity: number;
  chunkIndex: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
  model_used?: string;
  created_at: string;
}

// ── API Request/Response Types ────────────────────────────────────────────────

export interface ChatRequest {
  question: string;
  conversationId?: string;
  modelId?: string;
  history?: Array<{ role: MessageRole; content: string }>;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  relatedQuestions: string[];
  modelUsed: string;
  conversationId: string;
  messageId: string;
}

export interface UploadResponse {
  documentId: string;
  filename: string;
  status: DocumentStatus;
  chunkCount?: number;
  warnings?: string[];
  error?: string;
}

export interface DashboardStats {
  totalDocuments: number;
  indexedDocuments: number;
  totalChunks: number;
  totalConversations: number;
  processingDocuments: number;
  failedDocuments: number;
}

// ── Client-side store types ────────────────────────────────────────────────────

export interface UIMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
  modelUsed?: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatState {
  conversationId: string | null;
  messages: UIMessage[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
}
