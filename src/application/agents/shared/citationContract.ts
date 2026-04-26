/**
 * Citation contract — prepended to every Athena agent's system prompt.
 * Source of truth: docs/agents/00_citation_contract.md.
 * Keep these two in sync; the verifier (S3) enforces the rules at runtime.
 */
export const CITATION_CONTRACT = `=== CITATION CONTRACT (NON-NEGOTIABLE) ===

Every factual claim you produce MUST be backed by an "evidence" array.
Each evidence item is:
{
  "doc_id": "<Document.id from context>",
  "section": "§<n.m>" | "§<n.m.k>" | "header:<verbatim header>",
  "page": <integer | null>,
  "quote": "<verbatim string ≤ 240 chars copied EXACTLY from the chunk>",
  "chunk_id": "<Chunk.id provided by retrieval>"
}

HARD RULES:
1. NEVER paraphrase inside "quote". Copy verbatim.
2. If a number, name, date, or contractual term cannot be located in the
   provided chunks, set the field to null and add a "gap" entry.
3. NEVER use external knowledge to fill a value. External knowledge is
   allowed ONLY in "commentary" fields tagged "(external)".
4. If two chunks conflict, surface BOTH with "conflict": true.
5. Output is JSON only. No prose outside the schema.
6. Self-check before returning: every quoted string must appear in the
   retrieved chunks. If not, set to null + gap.
7. Whitespace and casing in "quote" may be normalized; numbers must match
   the source character-for-character.
8. NEVER assign citation IDs (c1, c2, …) yourself. The normalizer does it.
9. NEVER assign finding IDs (rf1, rf2, …) yourself. The normalizer does it.
`;
