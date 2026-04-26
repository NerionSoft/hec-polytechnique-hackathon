import { z } from "zod";

export const S2_SCHEMA_VERSION = "v1";

const SECTION_KEYS = ["thesis", "snapshot", "risks", "questions", "recommendation"] as const;

const memoSectionSchema = z.object({
  section_key: z.enum(SECTION_KEYS),
  title: z.string().max(80),
  body: z.string().max(4000),
  reviewed: z.boolean().default(false),
  citations_used: z.array(z.string()).default([]),
  redflags_used: z.array(z.string()).default([]),
});

const newCitationSchema = z.object({
  tmp_ref: z.string(), // "new_1", "new_2", …
  doc_id: z.string(),
  chunk_id: z.string().nullable(),
  section: z.string().nullable(),
  page: z.number().int().nullable().optional(),
  excerpt: z.string().min(1).max(240),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const S2OutputSchema = z.object({
  memo_status: z.enum(["DRAFT", "REVIEW", "FINAL", "NEEDS_REVIEW"]).default("DRAFT"),
  review_progress: z.number().min(0).max(1).default(0),
  pending_items: z.number().int().min(0).default(5),
  sections: z.array(memoSectionSchema).length(5),
  new_citations: z.array(newCitationSchema).default([]),
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
