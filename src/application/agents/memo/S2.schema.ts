import { z } from "zod";

export const S2_SCHEMA_VERSION = "v2";

const SECTION_KEYS = ["thesis", "snapshot", "risks", "questions", "recommendation"] as const;

const memoSectionSchema = z.object({
  section_key: z.enum(SECTION_KEYS),
  title: z.string(),
  body: z.string(),
  reviewed: z.boolean(),
  citations_used: z.array(z.string()),
  redflags_used: z.array(z.string()),
});

const newCitationSchema = z.object({
  tmp_ref: z.string(),
  doc_id: z.string(),
  chunk_id: z.string().nullable(),
  section: z.string().nullable(),
  page: z.number().int().nullable(),
  excerpt: z.string(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const S2OutputSchema = z.object({
  memo_status: z.enum(["DRAFT", "REVIEW", "FINAL", "NEEDS_REVIEW"]),
  review_progress: z.number(),
  pending_items: z.number().int(),
  sections: z.array(memoSectionSchema),
  new_citations: z.array(newCitationSchema),
});

export type S2Output = z.infer<typeof S2OutputSchema>;
export type MemoSectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_ORDER: readonly MemoSectionKey[] = SECTION_KEYS;

const SECTION_TITLES: Record<MemoSectionKey, string> = {
  thesis: "Investment Thesis",
  snapshot: "Financial Snapshot",
  risks: "Key Risks & Mitigants",
  questions: "Questions for Management",
  recommendation: "IC Recommendation",
};
export function defaultSectionTitle(key: MemoSectionKey): string {
  return SECTION_TITLES[key];
}
