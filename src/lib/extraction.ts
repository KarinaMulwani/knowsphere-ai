// =============================================================================
// KnowSphere AI - Text extraction from documents
// Supports: PDF, TXT, Markdown, DOCX
// =============================================================================

/** Result from extracting text from a document file */
export interface ExtractionResult {
  text: string;
  /** Page count (PDFs only) */
  pageCount?: number;
  /** True if text was found */
  hasContent: boolean;
  /** Warning messages (e.g., scanned PDF) */
  warnings: string[];
}

/**
 * Extract text from a Buffer based on the file's MIME type or extension.
 * Never throws — returns error info in the result instead.
 */
export async function extractText(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractionResult> {
  const ext = filename.toLowerCase().split('.').pop() ?? '';

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return extractPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return extractDocx(buffer);
  }

  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    ['txt', 'md', 'mdx', 'markdown'].includes(ext)
  ) {
    return extractPlainText(buffer);
  }

  return {
    text: '',
    hasContent: false,
    warnings: [`Unsupported file type: ${mimeType || ext}`],
  };
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  try {
    // Handle both CJS and ESM module shapes
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as { default?: typeof pdfParseModule } & typeof pdfParseModule).default ?? pdfParseModule;
    const data = await (pdfParse as unknown as (buf: Buffer) => Promise<{ text: string; numpages: number }>)(buffer);

    const text = data.text?.trim() ?? '';
    const pageCount = data.numpages ?? 0;
    const warnings: string[] = [];

    if (!text || text.length < 50) {
      warnings.push(
        'Very little text was extracted from this PDF. It may be a scanned image PDF without OCR text. ' +
          'Consider running OCR software on the file before uploading.'
      );
    }

    // Preserve page boundaries using form-feed characters
    return {
      text,
      pageCount,
      hasContent: text.length > 0,
      warnings,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      text: '',
      hasContent: false,
      warnings: [`PDF extraction failed: ${msg}. The file may be corrupted or password-protected.`],
    };
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });

    const text = result.value?.trim() ?? '';
    const warnings = result.messages
      .filter((m) => m.type === 'warning')
      .map((m) => m.message);

    return {
      text,
      hasContent: text.length > 0,
      warnings,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      text: '',
      hasContent: false,
      warnings: [`DOCX extraction failed: ${msg}.`],
    };
  }
}

function extractPlainText(buffer: Buffer): ExtractionResult {
  try {
    const text = buffer.toString('utf-8').trim();
    return {
      text,
      hasContent: text.length > 0,
      warnings: text.length === 0 ? ['The file appears to be empty.'] : [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      text: '',
      hasContent: false,
      warnings: [`Text extraction failed: ${msg}`],
    };
  }
}
