import { z } from "zod";

/**
 * Shared "evidence" item — one verbatim quote with traceability back to a
 * Chunk + Document. Every claim emitted by an agent must carry at least one.
 */
export const EvidenceSchema = z.object({
  doc_id: z.string(),
  section: z.string().nullable(),
  page: z.number().int().nullable().optional(),
  quote: z.string().min(1).max(240),
  chunk_id: z.string().nullable(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const GapSchema = z.object({
  field: z.string(),
  reason: z.string(),
  suggested_request: z.string().nullable().optional(),
});

export type Gap = z.infer<typeof GapSchema>;
