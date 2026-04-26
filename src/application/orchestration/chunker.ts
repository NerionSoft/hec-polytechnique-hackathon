/**
 * Section-aware chunker.
 *
 * The dataset PDFs are structured with numbered sections like
 *   "1. EXECUTIVE SUMMARY", "2.1 Definitions", "§14.2 Change of Control".
 * Splitting on these headers gives semantically coherent chunks that the
 * agents can cite by sectionRef.
 *
 * Fallback: when no headers are detected, fall back to fixed-size sliding
 * paragraphs to avoid emitting a single 30k-token chunk.
 */
export interface ChunkPiece {
  text: string;
  sectionRef: string | null;
  /** 1-based approximate page index, computed from form-feed (\f) positions
   *  inserted by unpdf when the source PDF preserves them. Best-effort. */
  page: number | null;
}

export interface ChunkerOptions {
  maxChars?: number; // hard cap per chunk
  minChars?: number; // skip chunks below this length
}

const DEFAULTS: Required<ChunkerOptions> = {
  maxChars: 4_000,
  minChars: 60,
};

// Matches headers like "1. EXECUTIVE SUMMARY", "2.1 Scope", "§14.2 Change of Control".
// The trailing `\.?` accepts the common "1. " punctuation in the dataset PDFs.
const HEADER_RX = /^\s*(?:§\s*)?(\d+(?:\.\d+){0,3})\.?\s+([A-Z][^\n]{0,120})$/m;

/**
 * Split text into ChunkPiece[]. Each piece is at most opts.maxChars long
 * and tagged with the most recent section heading.
 */
export function chunkText(rawText: string, opts: ChunkerOptions = {}): ChunkPiece[] {
  const { maxChars, minChars } = { ...DEFAULTS, ...opts };
  if (!rawText) return [];

  // Split on form-feed markers to track approximate pages.
  const pages = rawText.split(/\f/);
  const out: ChunkPiece[] = [];
  let currentSection: string | null = null;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageText = pages[pageIdx];
    const pageNumber = pages.length > 1 ? pageIdx + 1 : null;
    // Split into paragraphs first
    const paragraphs = pageText
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+\n/g, "\n").trim())
      .filter(Boolean);

    let buffer = "";
    let bufferSection: string | null = currentSection;

    const flush = (): void => {
      const text = buffer.trim();
      if (text.length >= minChars) {
        out.push({
          text,
          sectionRef: bufferSection ? `§${bufferSection}` : null,
          page: pageNumber,
        });
      }
      buffer = "";
      bufferSection = currentSection;
    };

    for (const paragraph of paragraphs) {
      const headerMatch = paragraph.match(HEADER_RX);
      if (headerMatch) {
        // Hitting a new header → flush the current buffer first
        flush();
        currentSection = headerMatch[1] ?? null;
        bufferSection = currentSection;
      }
      const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      if (candidate.length > maxChars) {
        flush();
        // Paragraph alone exceeds maxChars → hard-split it
        if (paragraph.length > maxChars) {
          for (const slice of slicePreservingWords(paragraph, maxChars)) {
            if (slice.length >= minChars) {
              out.push({
                text: slice,
                sectionRef: currentSection ? `§${currentSection}` : null,
                page: pageNumber,
              });
            }
          }
          buffer = "";
          continue;
        }
        buffer = paragraph;
      } else {
        buffer = candidate;
      }
    }
    flush();
  }

  return out;
}

function slicePreservingWords(text: string, maxChars: number): string[] {
  const slices: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(text.length, i + maxChars);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > i + maxChars / 2) end = lastSpace;
    }
    slices.push(text.slice(i, end).trim());
    i = end;
  }
  return slices;
}

/**
 * Approximate token count = chars / 4. Good enough for budgeting.
 */
export function approxTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
