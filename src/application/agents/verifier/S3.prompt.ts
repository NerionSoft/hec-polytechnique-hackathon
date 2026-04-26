import type { AgentContext } from "../shared/agentTypes";

export interface S3MemoSection {
  section_key: "thesis" | "snapshot" | "risks" | "questions" | "recommendation";
  body: string;
}

export interface S3CitationLookup {
  displayId: string;
  chunkId: string | null;
  page: number | null;
  excerpt: string;
}

export interface S3ChunkLookup {
  id: string;
  page: number | null;
  text: string;
}

export interface S3Input {
  ctx: AgentContext;
  memo_sections: S3MemoSection[];
  citations: S3CitationLookup[];
  finding_display_ids: string[];
  chunk_store: S3ChunkLookup[];
}

export const S3_SYSTEM_PROMPT = `ROLE: Adversarial citation auditor. You verify that every [cN] in the memo body points to a Citation whose excerpt actually appears inside the referenced Chunk, and that every [rfN] points to an existing Finding.

PROCEDURE (deterministic, walk linearly):
For each section:
  Extract every [cN] and [rfN] tag from body.
  For each [cN]:
    1. Find the Citation by displayId in citations[]. Missing → fail "citation_not_found".
    2. Locate the Chunk in chunk_store by Citation.chunkId. Missing → fail "chunk_not_found".
    3. Verify Citation.excerpt is a substring of Chunk.text after normalization (collapse whitespace, lowercase). Otherwise → fail "quote_not_in_chunk".
    4. If Citation.page is set, verify Chunk.page matches within ±1. Otherwise → fail "page_mismatch".
  For each [rfN]:
    Verify the displayId exists in finding_display_ids[]. Otherwise → fail "redflag_not_found".

  Then scan the body for SENTENCES that contain a number, named entity, date, or contractual term ("change of control", "termination", "covenant", …) WITHOUT any inline tag in the same sentence — emit an unsupported_claim entry.

OUTPUT REQUIREMENTS:
- verdict: "pass" iff failures.length === 0; otherwise "fail".
- pass_rate: passed_count / max(1, checked_citations_count + checked_redflags_count).
- failures[]: include memo_excerpt (≤ 280 chars around the failing tag), claimed_tag (verbatim "[cN]" or "[rfN]"), issue, and suggested_fix when applicable ("remove", "replace_with: [cM]", or "rewrite_claim_as: …").

HARD RULES:
- This step is deterministic — no creativity, no commentary outside the schema.
- If the same chunk passes all four checks for a citation, count it as passed.
- Numbers in citation excerpts must match the chunk character-for-character.`;

export function buildS3UserPrompt(input: S3Input): string {
  return [
    "# DEAL CONTEXT",
    JSON.stringify({ dealId: input.ctx.dealId, leadId: input.ctx.leadId }, null, 2),
    "",
    "# MEMO SECTIONS",
    JSON.stringify(input.memo_sections, null, 2),
    "",
    "# CITATIONS (displayId → chunkId, excerpt, page)",
    JSON.stringify(input.citations, null, 2),
    "",
    "# FINDING DISPLAY IDS",
    JSON.stringify(input.finding_display_ids, null, 2),
    "",
    "# CHUNK STORE (id, page, text)",
    JSON.stringify(input.chunk_store, null, 2),
    "",
    "Walk the procedure now and emit the verdict.",
  ].join("\n");
}
