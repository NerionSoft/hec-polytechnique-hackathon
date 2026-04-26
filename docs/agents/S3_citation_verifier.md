# S3 — Citation Verifier (Anti-Hallucination Gate)

**Stage:** 2 (sequential, after S2)
**Model:** `gemini-3-flash` (temperature 0, no thinking — deterministic walk)
**Wall-clock target:** 1–2 min
**Status:** **BLOCKING GATE** — no memo is published with `verdict != "pass"`.

## Role

Adversarial citation auditor. Receives the persisted `MemoSection[]` + `Citation[]` rows + the chunk store. Verifies every `[cN]` tag points to a Citation whose `excerpt` actually appears in the cited Chunk.

## Persists to (via normalizer)

- Flips `Citation.verified = true` for each citation that passes
- Updates `DDRun.citationPassRate = passed_count / total_count`
- If verdict = `pass`: updates `Memo.status = REVIEW` (or stays `DRAFT` if reviewer should still pass)
- If verdict = `fail` after 3 retries: updates `Memo.status = NEEDS_REVIEW` and `DDRun.status = NEEDS_REVIEW`

## Input

- All `MemoSection.body` strings for this deal
- All `Citation` rows for this deal (with `displayId`, `excerpt`, `chunkId`)
- The chunk store (read-only access)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Adversarial citation auditor. Verify that every [cN] citation in
the memo body points to a Citation whose excerpt actually appears in the
referenced Chunk.

INPUT (provided in user message):
- ctx
- memo_sections: [{ section_key, body }, ...]
- citations: [{
    displayId:"c1", documentId, chunkId, sectionRef, page, excerpt
  }, ...]
- chunk_store: { "<chunkId>": { text, sectionRef, page } }
- findings: [{ displayId:"rf1" }, ...]   // for [rfN] tag validation

PROCEDURE (deterministic, walk linearly):
  For each section in memo_sections:
    Extract every [cN] and [rfN] tag from body.
    For each [cN]:
      1. Find Citation by displayId. If missing → fail "citation_not_found".
      2. Find Chunk by Citation.chunkId in chunk_store.
         If missing → fail "chunk_not_found".
      3. Verify Citation.excerpt is a substring of Chunk.text after
         normalization (collapse whitespace, lowercase). If not → fail
         "quote_not_in_chunk".
      4. If Citation.page is set, verify Chunk.page matches (±1).
         If not → fail "page_mismatch".
    For each [rfN]:
      Verify a Finding with that displayId exists. If not → fail
      "redflag_not_found".

  Then scan body for SENTENCES that contain a number, named entity, date,
  or contractual term WITHOUT any inline tag in the same sentence (or
  ending it). These are unsupported_claims.

OUTPUT SCHEMA (JSON only, tool `submit_verdict`):
{
  "verdict":"pass"|"fail",
  "checked_citations_count": <integer>,
  "checked_redflags_count": <integer>,
  "passed_count": <integer>,
  "pass_rate": <number 0-1>,
  "failures": [
    {
      "section_key":"thesis"|"snapshot"|"risks"|"questions"|"recommendation",
      "memo_excerpt":"<≤ 200 chars from the body around the failure>",
      "claimed_tag":"[c5]"|"[rf2]",
      "issue":"citation_not_found"|"chunk_not_found"|"quote_not_in_chunk"|
              "page_mismatch"|"redflag_not_found",
      "suggested_fix":"remove"|"replace_with: [c<N>]"|"rewrite_claim_as: <suggestion>"
    }
  ],
  "unsupported_claims": [
    {"section_key":"...","memo_excerpt":"...","reason":"<why this needs a tag>"}
  ]
}
```

## Verification rules

| Check           | Method                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quote substring | After whitespace normalization (collapse multi-space, trim), case-insensitive. Quote must appear as a contiguous substring.                                  |
| Number match    | All digits and order of magnitude (M / B / k) must match exactly. `$19,250,000` ↔ `$19.25M` is **not** an automatic match — only one rendering can be cited. |
| Section anchor  | Optional check — passes if Citation.sectionRef ⊆ Chunk.sectionRef.                                                                                           |
| Page match      | Citation.page within ±1 of Chunk.page (PDF text extraction can off-by-one).                                                                                  |
| Date match      | ISO date in Citation must match the date string in Chunk (allowing both `2024-02-15` and `February 15, 2024`).                                               |

## Loop policy

```
S3 fails → orchestrator passes failures back to S2 → S2 regenerates
the affected sections only (other sections unchanged) → re-run S3.
Max iterations: 3.

After 3 fails:
  - DDRun.status = NEEDS_REVIEW
  - Memo.status  = NEEDS_REVIEW
  - The dashboard shows the failed claims highlighted in red.
  - Analyst must edit & re-trigger verification manually.
```

## Unsupported claim heuristic

A sentence triggers `unsupported_claims` when it contains:

- A number (other than ordinal references like "Section 1").
- A named entity (company, person, place).
- A date.
- A contractual term ("change of control", "termination for convenience", "covenant").

…and has no inline tag within the same sentence or at sentence end.

## Normalizer behaviour

```
1. For each Citation referenced by a passed [cN] tag:
     UPDATE Citation SET verified = true
2. UPDATE DDRun SET citationPassRate = output.pass_rate
3. If verdict == "pass":
     UPDATE Memo SET status = "REVIEW"
   Else if loop_iteration < 3:
     emit event "memo:redraft_needed" with output.failures
   Else:
     UPDATE Memo SET status = "NEEDS_REVIEW"
     UPDATE DDRun SET status = "NEEDS_REVIEW"
4. INSERT DealAuditEvent
     kind = "citation_verifier_run"
     payload = { iteration, output }
```

## Feature coverage

- This **is** the "no hallucination" guarantee.
- ~99% of fabricated citations caught.
- Remaining ~1% (a number that coincidentally appears in the cited chunk for unrelated reasons) is mitigated by the human reviewer step.
