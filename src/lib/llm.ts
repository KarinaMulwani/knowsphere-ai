// =============================================================================
// KnowSphere AI - NVIDIA NIM LLM client with fallback
// =============================================================================

import OpenAI from 'openai';
import {
  FALLBACK_ORDER,
  NVIDIA_BASE_URL,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES_PER_MODEL,
  CHAT_MODELS,
} from './config';

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

export interface ChatResult {
  content: string;
  modelUsed: string;
  sources: Source[];
  relatedQuestions: string[];
}

/** Permanent error codes that should NOT trigger a fallback retry */
const PERMANENT_ERROR_CODES = new Set([
  'invalid_api_key',
  'invalid_request_error',
  'context_length_exceeded',
  'invalid_model',
]);

function isTransientError(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    if (PERMANENT_ERROR_CODES.has(err.code ?? '')) return false;
    // 401, 400 are permanent; 429, 500, 503 are transient
    return err.status === 429 || err.status >= 500 || err.status === 408;
  }
  // Network/timeout errors are transient
  if (err instanceof Error) {
    return (
      err.message.includes('timeout') ||
      err.message.includes('ECONNRESET') ||
      err.message.includes('fetch failed')
    );
  }
  return false;
}

function createNvidiaClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: NVIDIA_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
  });
}

function buildSystemPrompt(sources: Source[]): string {
  const hasContext = sources.length > 0;

  if (!hasContext) {
    return `You are KnowSphere AI, the dedicated Internal Company Knowledge Assistant.
Project Purpose: Provide private, secure assistance over approved company SOPs, service descriptions, commercial pricing rules, FAQs, and project engineering records.

Instructions for when no specific document chunks are retrieved:
1. GREETINGS & INTRODUCTIONS: If the user greets you ("hi", "hello", "hey"), asks who you are, or asks what you can do, respond warmly, politely, and professionally! Introduce yourself as KnowSphere AI, the Internal Company Knowledge Assistant. Explain that you help team members quickly find answers across:
   • Standard Operating Procedures (e.g., travel & expense reimbursement, remote work equipment stipends, employee onboarding)
   • Platform Service Descriptions & Architecture
   • Commercial Pricing Tiers & Sales Discount Approval Rules
   • Company Policies & Helpdesk SLAs (e.g., customer refund terms, IT incident escalation)
   Invite them to ask any question or upload new documents in the Knowledge Base.

2. QUESTIONS ABOUT COMPANY POLICIES OR DATA NOT FOUND: If the user asks a specific factual question about company policies, finances, employees, or projects that is genuinely not on record:
   • State clearly: "This specific information was not found in our approved company documentation (SOPs, service descriptions, pricing rules, or project records)."
   • Politely advise them to upload the relevant document to the Knowledge Base, or contact the responsible department (e.g., People Operations for HR, Finance for budgets/payroll, or IT Ops for system credentials).

3. GENERAL CONVERSATION & ASSISTANCE: For general workplace questions or requests for clarification, be helpful, professional, and courteous while staying grounded in your role as an internal enterprise assistant.`;
  }

  const contextBlock = sources
    .map(
      (s, i) =>
        `[Source ${i + 1}] Document: "${s.filename}" | Page: ${s.pageNumber ?? 'N/A'} | Section/Chunk: ${s.chunkIndex}\n${s.excerpt}`
    )
    .join('\n\n---\n\n');

  return `You are KnowSphere AI, the dedicated Internal Company Knowledge Assistant.
Project Purpose: Create a private, secure assistant over approved SOPs, service descriptions, pricing rules, FAQs, and project documentation. Cite sources, enforce document access boundaries, and say when the answer is not found.

RETRIEVED APPROVED COMPANY DOCUMENTATION:
${contextBlock}

CRITICAL RULES FOR ANSWERING:
1. GROUNDING: Base your answer primarily on the retrieved document excerpts above.
2. MANDATORY SOURCE CITATIONS: Always cite the source document name and page number or section naturally in your response (e.g., "According to the Travel & Expense Reimbursement Policy (SOP-FIN-004, Page 2)..." or "[Source: POL-REV-008_Refund_and_Cancellation_Policy.pdf]").
3. ACCESS BOUNDARIES: If an excerpt mentions a document classification (Public, Internal, Confidential, Restricted) or specific approval requirements (e.g., Manager, Director, VP, or CRO approval), clearly highlight these boundaries to the user.
4. UNFOUND DETAILS: If the excerpts only partially answer the question or lack a specific requested figure/detail, explicitly state what is confirmed by the documentation and state: "The remaining specific details are not found in the current approved documentation on file." Do not invent policies, deadlines, or numbers.
5. CONVERSATION: If the user is combining a greeting with a question (e.g., "Hi, what is our refund policy?"), greet them warmly before providing the structured, cited answer.
6. FORMATTING: Use clean bullet points, numbered steps, or bold headers where appropriate to make company SOPs and policies easy to read and execute.`;
}

function extractRelatedQuestions(answer: string, originalQuestion: string): string[] {
  const lower = (answer + ' ' + originalQuestion).toLowerCase();
  const questions: string[] = [];

  // Reimbursement & Travel
  if (lower.includes('reimburse') || lower.includes('expense') || lower.includes('travel') || lower.includes('per diem')) {
    questions.push('What is the deadline for submitting receipts in Expensify?');
    questions.push('What are the approval limits for managers and directors?');
    questions.push('What is the daily meal per diem allowance?');
  }

  // Remote Work & Equipment
  if (lower.includes('remote') || lower.includes('stipend') || lower.includes('equipment') || lower.includes('laptop') || lower.includes('hardware')) {
    questions.push('How much is the one-time home office stipend?');
    questions.push('What is the hardware refresh cycle for company laptops?');
    questions.push('What are the VPN requirements for remote work?');
  }

  // Pricing & Discounts
  if (lower.includes('pric') || lower.includes('tier') || lower.includes('discount') || lower.includes('seat')) {
    questions.push('What is included in the Business vs Enterprise tier?');
    questions.push('What are the approved discount thresholds for sales reps?');
    questions.push('Who must approve discounts exceeding 20%?');
  }

  // Refund & Cancellation
  if (lower.includes('refund') || lower.includes('cancellation') || lower.includes('guarantee')) {
    questions.push('Are custom integration fees refundable?');
    questions.push('How long does a refund take to process?');
    questions.push('What are the eligibility criteria for a 30-day refund?');
  }

  // Onboarding & HR
  if (lower.includes('onboard') || lower.includes('new hire') || lower.includes('mentor') || lower.includes('training')) {
    questions.push('What are the 30, 60, and 90-day onboarding milestones?');
    questions.push('What credentials and accounts are issued on Day 1?');
    questions.push('How long is a department mentor assigned?');
  }

  // IT & SLAs
  if (lower.includes('it ') || lower.includes('helpdesk') || lower.includes('sla') || lower.includes('incident') || lower.includes('escalat')) {
    questions.push('What is the SLA for a P1 Critical incident?');
    questions.push('How do I contact the emergency IT escalation desk?');
    questions.push('What Slack channel is used for incident war rooms?');
  }

  // Architecture & Project Docs
  if (lower.includes('knowsphere') || lower.includes('architecture') || lower.includes('rag') || lower.includes('vector')) {
    questions.push('What LLM model powers KnowSphere AI?');
    questions.push('How does KnowSphere enforce tenant data isolation?');
    questions.push('What document formats can be uploaded and indexed?');
  }

  // Fallbacks if fewer than 2 matched
  if (questions.length < 2) {
    questions.push('What are our approved company SOPs?');
    questions.push('How do our pricing tiers and discount rules work?');
    questions.push('What is our customer refund and cancellation policy?');
    questions.push('How do I submit an expense for reimbursement?');
  }

  // Deduplicate and return top 4
  return Array.from(new Set(questions)).slice(0, 4);
}

/**
 * Run a RAG-grounded chat completion with automatic model fallback.
 * modelId: the user-selected model. If omitted, uses the configured primary model.
 */
export async function runRagChat(
  question: string,
  sources: Source[],
  modelId?: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  customApiKey?: string
): Promise<ChatResult> {
  const apiKey = customApiKey?.trim() || process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA API Key is missing. Please enter your API key in Settings or configure NVIDIA_API_KEY in .env.local.');
  }

  // Build the ordered list: requested model first, then fallbacks and guaranteed live models
  const requestedModel = modelId ?? FALLBACK_ORDER[0];
  const ordered = Array.from(
    new Set([
      requestedModel,
      ...FALLBACK_ORDER,
      'nvidia/nemotron-3.5-bolt-e4b',
      'google/diffusiongemma-26b-a4b-it',
      'nvidia/riva-translate-4b-instruct-v2',
    ])
  );

  const systemPrompt = buildSystemPrompt(sources);
  const client = createNvidiaClient(apiKey);

  let lastError: unknown;

  for (const model of ordered) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const messages: OpenAI.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-6).map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: question },
        ];

        const response = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.1,
          max_tokens: 1024,
          stream: false,
        });

        const content = response.choices[0]?.message?.content ?? '';
        if (!content) throw new Error('Empty response received from model.');

        return {
          content,
          modelUsed: model,
          sources,
          relatedQuestions: extractRelatedQuestions(content, question),
        };
      } catch (err) {
        lastError = err;
        console.warn(
          `[KnowSphere NIM] Model "${model}" failed (attempt ${attempt + 1}):`,
          err instanceof Error ? err.message : err
        );

        if (!isTransientError(err)) {
          // Permanent or retired/unprovisioned model — move directly to next fallback model
          break;
        }
        // Transient error (rate limit, server 500) — retry once then move on
        if (attempt < MAX_RETRIES_PER_MODEL) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
  }

  // All models failed
  const errMsg =
    lastError instanceof Error ? lastError.message : 'Unknown error';
  throw new Error(
    `All configured models failed. Last error: ${errMsg}. ` +
      'Check your NVIDIA_API_KEY and ensure at least one model is available.'
  );
}

/** Get display name for a model ID */
export function getModelDisplayName(modelId: string): string {
  return CHAT_MODELS.find((m) => m.id === modelId)?.displayName ?? modelId;
}
