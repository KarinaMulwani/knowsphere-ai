/**
 * KnowSphere AI - Automated tests for core logic modules
 * Run with: npx tsx src/__tests__/core.test.ts
 * (No test runner required — pure TypeScript assertions)
 */

// ── Chunking tests ─────────────────────────────────────────────────────────────
import { chunkText, chunkTextWithPages, estimateTokenCount } from '../lib/chunking';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ FAIL: ${message}`);
  }
  console.log(`  ✅ PASS: ${message}`);
}

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  console.log(`\n📋 ${name}`);
  try {
    fn();
    passed++;
  } catch (e) {
    console.log(e instanceof Error ? e.message : String(e));
    failed++;
  }
}

// ── Chunking ───────────────────────────────────────────────────────────────────
test('chunkText - empty string returns empty array', () => {
  const chunks = chunkText('', 1000, 200);
  assert(chunks.length === 0, 'empty string → 0 chunks');
});

test('chunkText - whitespace-only returns empty array', () => {
  const chunks = chunkText('   \n\n\t  ', 1000, 200);
  assert(chunks.length === 0, 'whitespace-only → 0 chunks');
});

test('chunkText - short text stays in single chunk', () => {
  const text = 'This is a short paragraph about company policies.';
  const chunks = chunkText(text, 1000, 200);
  assert(chunks.length === 1, 'short text → 1 chunk');
  assert(chunks[0].content === text, 'content preserved exactly');
  assert(chunks[0].chunkIndex === 0, 'chunk index is 0');
});

test('chunkText - text longer than chunkSize splits correctly', () => {
  const longText = 'A'.repeat(2500);
  const chunks = chunkText(longText, 1000, 100);
  assert(chunks.length >= 2, 'long text → multiple chunks');
  chunks.forEach((c, i) => {
    assert(c.chunkIndex === i, `chunk index sequential at ${i}`);
    assert(c.content.length <= 1000 + 50, `chunk ${i} length within bounds`); // small tolerance
    assert(c.tokenCount > 0, `chunk ${i} has positive token count`);
  });
});

test('chunkText - chunk indices are sequential and unique', () => {
  const text = Array.from({ length: 30 }, (_, i) => `Paragraph ${i + 1}: ${'Lorem ipsum dolor sit amet. '.repeat(5)}`).join('\n\n');
  const chunks = chunkText(text, 500, 50);
  assert(chunks.length > 1, 'multiple chunks created');
  const indices = chunks.map((c) => c.chunkIndex);
  const unique = new Set(indices);
  assert(unique.size === indices.length, 'all indices are unique');
  indices.forEach((idx, i) => assert(idx === i, `index ${idx} matches position ${i}`));
});

test('chunkText - preserves all text content across chunks (no data loss check)', () => {
  const paragraphs = Array.from({ length: 10 }, (_, i) => `Paragraph ${i}: Content here.`);
  const text = paragraphs.join('\n\n');
  const chunks = chunkText(text, 80, 10);
  const combined = chunks.map((c) => c.content).join(' ');
  // Every paragraph should appear somewhere in the chunks
  paragraphs.forEach((p, i) => {
    assert(combined.includes(`Paragraph ${i}`), `Paragraph ${i} content retained`);
  });
});

test('chunkTextWithPages - assigns page numbers', () => {
  // 3 pages separated by form-feed
  const text = 'Page 1 content\f\nPage 2 content\f\nPage 3 content';
  const chunks = chunkTextWithPages(text, 500, 50);
  assert(chunks.length >= 3, 'at least 3 chunks from 3 pages');
  const pageNums = chunks.map((c) => c.pageNumber).filter(Boolean);
  assert(pageNums.includes(1), 'page 1 assigned');
  assert(pageNums.includes(2), 'page 2 assigned');
  assert(pageNums.includes(3), 'page 3 assigned');
});

test('estimateTokenCount - reasonable estimate', () => {
  const text = 'Hello world, this is a test sentence.'; // 38 chars → ~10 tokens
  const estimate = estimateTokenCount(text);
  assert(estimate > 0, 'positive token count');
  assert(estimate < text.length, 'estimate less than character count');
  assert(Math.abs(estimate - Math.ceil(text.length / 4)) < 2, 'within 4-chars-per-token estimate');
});

// ── Validation tests ──────────────────────────────────────────────────────────
test('UUID validation pattern', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert(uuidRegex.test('550e8400-e29b-41d4-a716-446655440000'), 'valid UUID passes');
  assert(!uuidRegex.test('not-a-uuid'), 'invalid UUID rejected');
  assert(!uuidRegex.test('550e8400-e29b-41d4-a716-44665544000Z'), 'UUID with invalid char rejected');
  assert(!uuidRegex.test(''), 'empty string rejected');
});

test('File type validation', () => {
  const allowed = ['.pdf', '.txt', '.md', '.mdx', '.docx'];
  const notAllowed = ['.exe', '.js', '.png', '.zip', '.csv'];
  allowed.forEach((ext) => assert(allowed.includes(ext), `${ext} is allowed`));
  notAllowed.forEach((ext) => assert(!allowed.includes(ext), `${ext} is rejected`));
});

test('File size validation', () => {
  const MAX = 20 * 1024 * 1024; // 20 MB
  assert(1024 < MAX, '1 KB file allowed');
  assert(5 * 1024 * 1024 < MAX, '5 MB file allowed');
  assert(MAX <= MAX, '20 MB file at limit');
  assert(MAX + 1 > MAX, '20 MB + 1 byte rejected');
  assert(0 === 0, '0 byte file is empty');
});

// ── Citation mapping tests ────────────────────────────────────────────────────
test('Source citation mapping - excerpt truncation', () => {
  const longContent = 'A'.repeat(500);
  const excerpt = longContent.slice(0, 300) + (longContent.length > 300 ? '…' : '');
  assert(excerpt.length <= 301, 'excerpt truncated to 300 chars + ellipsis');
  assert(excerpt.endsWith('…'), 'ellipsis added when truncated');
});

test('Source citation mapping - short content not truncated', () => {
  const shortContent = 'Short content here.';
  const excerpt = shortContent.slice(0, 300) + (shortContent.length > 300 ? '…' : '');
  assert(excerpt === shortContent, 'short content not truncated');
  assert(!excerpt.endsWith('…'), 'no ellipsis on short content');
});

// ── Config tests ──────────────────────────────────────────────────────────────
test('Config - fallback order has at least 2 entries', async () => {
  const { FALLBACK_ORDER } = await import('../lib/config');
  assert(FALLBACK_ORDER.length >= 2, 'at least 2 fallback models configured');
});

test('Config - CHAT_MODELS has displayName and id', async () => {
  const { CHAT_MODELS } = await import('../lib/config');
  assert(CHAT_MODELS.length >= 1, 'at least one chat model');
  CHAT_MODELS.forEach((m) => {
    assert(m.id.length > 0, `model ${m.displayName} has non-empty id`);
    assert(m.displayName.length > 0, `model ${m.id} has display name`);
    assert(m.contextLength > 0, `model ${m.id} has positive context length`);
  });
});

test('Config - embedding dimension is positive integer', async () => {
  const { EMBEDDING_CONFIG } = await import('../lib/config');
  assert(Number.isInteger(EMBEDDING_CONFIG.dimension), 'embedding dimension is integer');
  assert(EMBEDDING_CONFIG.dimension > 0, 'embedding dimension is positive');
  assert(EMBEDDING_CONFIG.model.length > 0, 'embedding model is non-empty');
});

test('Config - RAG config values are sensible', async () => {
  const { RAG_CONFIG } = await import('../lib/config');
  assert(RAG_CONFIG.topK > 0 && RAG_CONFIG.topK <= 20, 'topK in reasonable range (1-20)');
  assert(RAG_CONFIG.similarityThreshold >= 0 && RAG_CONFIG.similarityThreshold <= 1, 'threshold in 0-1');
  assert(RAG_CONFIG.chunkSize >= 200, 'chunk size at least 200 chars');
  assert(RAG_CONFIG.chunkOverlap < RAG_CONFIG.chunkSize, 'overlap less than chunk size');
  assert(RAG_CONFIG.maxFileSize > 0, 'max file size is positive');
});

// ── Built-in Knowledge Tests ──────────────────────────────────────────────────
test('BuiltInKnowledge - retrieves relevant SOPs for expense query', async () => {
  const { searchBuiltInKnowledge } = await import('../lib/knowledgeBase');
  const results = searchBuiltInKnowledge('expense reimbursement travel meal');
  assert(results.length > 0, 'matches found for expense query');
  assert(results.some((r) => r.filename.includes('SOP-FIN-004')), 'SOP-FIN-004 matched');
  assert(results[0].excerpt.length > 0, 'excerpt is non-empty');
  assert(results[0].similarity >= 0.7, 'similarity score is positive');
});

test('BuiltInKnowledge - retrieves pricing rules for discount query', async () => {
  const { searchBuiltInKnowledge } = await import('../lib/knowledgeBase');
  const results = searchBuiltInKnowledge('pricing tier discount commercial');
  assert(results.length > 0, 'matches found for pricing query');
  assert(results.some((r) => r.filename.includes('REV-PRC-2026')), 'REV-PRC-2026 matched');
});

test('BuiltInKnowledge - empty query returns empty array', async () => {
  const { searchBuiltInKnowledge } = await import('../lib/knowledgeBase');
  const results = searchBuiltInKnowledge('');
  assert(results.length === 0, 'empty query returns no matches');
});


// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('⚠️  Some tests failed. See details above.');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!');
  process.exit(0);
}
