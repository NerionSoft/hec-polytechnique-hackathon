import { z } from "zod";

export const S3_SCHEMA_VERSION = "v2";

const SECTION_KEYS = ["thesis", "snapshot", "risks", "questions", "recommendation"] as const;

const failureSchema = z.object({
  section_key: z.enum(SECTION_KEYS),
  memo_excerpt: z.string(),
  claimed_tag: z.string(),
  issue: z.enum([
    "citation_not_found",
    "chunk_not_found",
    "quote_not_in_chunk",
    "page_mismatch",
    "redflag_not_found",
  ]),
  suggested_fix: z.string().nullable(),
});

const unsupportedSchema = z.object({
  section_key: z.enum(SECTION_KEYS),
  memo_excerpt: z.string(),
  reason: z.string(),
});

export const S3OutputSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  checked_citations_count: z.number().int(),
  checked_redflags_count: z.number().int(),
  passed_count: z.number().int(),
  pass_rate: z.number(),
  failures: z.array(failureSchema),
  unsupported_claims: z.array(unsupportedSchema),
});

export type S3Output = z.infer<typeof S3OutputSchema>;
export type S3Failure = z.infer<typeof failureSchema>;
