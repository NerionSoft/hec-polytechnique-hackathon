import { z } from "zod";

/**
 * Shared "evidence" item — one verbatim quote with traceability back to a
 * Chunk + Document. Every claim emitted by an agent must carry at least one.
 *
 * NOTE on Gemini structured output compatibility: `.min()`/`.max()` on
 * strings, `.optional()` chained with `.nullable()`, and `.optional()` on
 * primitives are all sources of "Request contains an invalid argument" 400s
 * when zod is converted to Gemini's `responseSchema`. We use plain
 * `.nullable()` everywhere instead.
 */
export const EvidenceSchema = z.object({
  doc_id: z.string(),
  section: z.string().nullable(),
  page: z.number().int().nullable(),
  quote: z.string(),
  chunk_id: z.string().nullable(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const GapSchema = z.object({
  field: z.string(),
  reason: z.string(),
  suggested_request: z.string().nullable(),
});

export type Gap = z.infer<typeof GapSchema>;
