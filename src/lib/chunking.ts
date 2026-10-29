// =============================================================================
// KnowSphere AI - Text chunking utilities
// =============================================================================

export interface TextChunk {
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  tokenCount: number;
}

/**
 * Simple character-based chunker with configurable size and overlap.
 * Splits on paragraph boundaries where possible, falls back to character boundary.
 */
export function chunkText(
  text: string,
  chunkSize = 1000,
  chunkOverlap = 200
): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: TextChunk[] = [];
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  // Split into paragraphs first for natural boundaries
  const paragraphs = cleanText.split(/\n\n+/);
  let current = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (current.length + trimmedPara.length + 2 <= chunkSize) {
      current = current ? current + '\n\n' + trimmedPara : trimmedPara;
    } else {
      // Flush current chunk
      if (current) {
        chunks.push({
          content: current.trim(),
          chunkIndex: chunkIndex++,
          tokenCount: estimateTokenCount(current),
        });
        // Start new chunk with overlap from the end of previous chunk
        const overlapStart = Math.max(0, current.length - chunkOverlap);
        const overlapText = current.slice(overlapStart).trim();
        current = overlapText ? overlapText + '\n\n' + trimmedPara : trimmedPara;
      } else {
        current = trimmedPara;
      }

      // If single paragraph is larger than chunkSize, split it further
      while (current.length > chunkSize) {
        const piece = current.slice(0, chunkSize);
        chunks.push({
          content: piece.trim(),
          chunkIndex: chunkIndex++,
          tokenCount: estimateTokenCount(piece),
        });
        current = current.slice(chunkSize - chunkOverlap);
      }
    }
  }

  // Flush any remaining text
  if (current.trim()) {
    chunks.push({
      content: current.trim(),
      chunkIndex: chunkIndex++,
      tokenCount: estimateTokenCount(current),
    });
  }

  return chunks;
}

/**
 * Chunk text that has page markers (e.g., from PDF extraction).
 * Pages are delimited by `\f` (form-feed) character.
 */
export function chunkTextWithPages(
  text: string,
  chunkSize = 1000,
  chunkOverlap = 200
): TextChunk[] {
  const pages = text.split('\f');
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  pages.forEach((pageText, pageIdx) => {
    if (!pageText.trim()) return;
    const pageChunks = chunkText(pageText, chunkSize, chunkOverlap);
    pageChunks.forEach((chunk) => {
      allChunks.push({
        ...chunk,
        chunkIndex: globalIndex++,
        pageNumber: pageIdx + 1,
      });
    });
  });

  return allChunks;
}

/** Rough token count approximation: ~4 chars per token for English text */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
