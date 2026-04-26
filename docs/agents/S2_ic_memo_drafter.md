# S2 — IC Memo Drafter

**Stage:** 2 (sequential, after S1)
**Model:** `gemini-3-pro` with `thinkingBudget: 8192` (temperature 0.4)
**Wall-clock target:** 2–3 min

## Role

Assembles the Investment Committee memo from S1 + A2..A9 outputs into a **structured** output (NOT free markdown). The 5 sections match exactly what the front expects, and the body uses inline tags `[c1]` (citation) and `[rf1]` (finding) that the `MemoBody` component renders into clickable drawers.

## Persists to (via normalizer)

- `Memo` row (1:1 with Deal)
- 5×`MemoSection` rows (one per `sectionKey`: `thesis`, `snapshot`, `risks`, `questions`, `recommendation`)
- New `Citation` rows for any quote not yet persisted by Stage 1 agents
- Updates `Citation.usedIn` array to include each section that references the citation

## Input

- `s1_output` (thesis JSON)
- `a2..a9` outputs
- All existing `Finding` rows (with `displayId` already assigned, e.g. `rf1`, `rf2`)
- All existing `Citation` rows (with `displayId` already assigned, e.g. `c1`, `c2`)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Assemble the IC memo from S1 + A2..A9 outputs into 5 structured
sections that the front renders directly.

INPUT (provided in user message):
- ctx
- s1_output
- a2..a9 outputs
- existing_findings:  [{ displayId:"rf1", agentId, externalId, severity,
                         category, title, summary, ... }, ...]
- existing_citations: [{ displayId:"c1", documentId, sectionRef, page,
                         excerpt, confidence }, ...]

OUTPUT SCHEMA (JSON only, tool `submit_memo`):
{
  "memo_status":"DRAFT"|"REVIEW"|"FINAL",
  "review_progress": <number 0-1>,
  "pending_items": <integer>,

  "sections": [
    {
      "section_key":"thesis",          // FIXED: thesis|snapshot|risks|questions|recommendation
      "title":"Investment Thesis",
      "body":"<markdown with inline [c1] [rf2] tags>",
      "reviewed": false,
      "citations_used":["c1","c2"],
      "redflags_used":["rf1","rf3"]
    },
    { "section_key":"snapshot",       "title":"Financial Snapshot",   "body":"...", ...},
    { "section_key":"risks",          "title":"Key Risks & Mitigants","body":"...", ...},
    { "section_key":"questions",      "title":"Questions for Management","body":"...", ...},
    { "section_key":"recommendation", "title":"IC Recommendation",    "body":"...", ...}
  ],

  // Any NEW citations that didn't exist after Stage 1 (S2 quoted something
  // fresh while writing the executive paragraphs). Normalizer assigns cN.
  "new_citations": [
    {
      "tmp_ref":"new_1",                      // for body inline replacement
      "doc_id":"<Document.id>",
      "chunk_id":"<Chunk.id>",
      "section":"§3.2",
      "page":24,
      "excerpt":"<verbatim ≤ 240 chars>",
      "confidence":"HIGH"|"MEDIUM"|"LOW"
    }
  ]
}

REQUIRED SECTIONS — content rules:

1. section_key="thesis" (Investment Thesis)
   - Open with the one-liner from s1_output
   - Include 3-5 thesis pillars (from S1)
   - Cite revenue, EBITDA, margin numbers from a2_output with [cN] tags
   - 200-300 words

2. section_key="snapshot" (Financial Snapshot)
   - Single dense paragraph: revenue · EBITDA · net debt · ARR · headcount
   - Each number gets a [cN] tag
   - 80-120 words

3. section_key="risks" (Key Risks & Mitigants)
   - Bulleted list, ONE bullet per HIGH or CRITICAL finding
   - Format per bullet:
       "• <severity uppercase>: <finding.title> [rfN] — <finding.detail>.
        Mitigant: <remediation_path>."
   - Order: CRITICAL first, then HIGH (severity desc), then by displayId
   - Don't include MEDIUM/LOW findings here (they're in the full risks page)

4. section_key="questions" (Questions for Management)
   - Numbered list of TOP 5–8 management questions
   - Pull from existing Findings.suggestedQuestion via [rfN] reference
   - Each question is one line, ending with the [rfN] it derives from

5. section_key="recommendation" (IC Recommendation)
   - 1 short paragraph: subject to (i)…(ii)…(iii)…, recommend proceeding
     to <action> at <valuation> if A2 has it; else "subject to QoE
     confirmation"
   - Reference the go_no_go_signal from S1
   - 80-120 words

INLINE TAG RULES:
- Citation reference: [cN] where N matches a Citation.displayId from
  existing_citations OR a tmp_ref like [new_1] from new_citations.
- Finding reference: [rfN] where N matches a Finding.displayId from
  existing_findings.
- NEVER invent IDs that don't exist. If you want to cite something not
  yet in existing_citations, ADD it to new_citations with a tmp_ref and
  use that tmp_ref in body. Normalizer rewrites it to [cN].
- Each [cN] / [rfN] must appear in the section's citations_used /
  redflags_used arrays.

REVIEW PROGRESS:
- review_progress = sections marked reviewed=true / 5
- pending_items = count of sections with reviewed=false

LENGTH CAP:
- Total body text across all 5 sections ≤ 2500 words.
```

## Inline tag rendering (front)

```
[c1]  → <CitationLink id="c1" />     opens drawer with Citation.excerpt + PDF.js
[rf1] → <RedFlagLink   id="rf1" />   opens drawer with Finding details
```

The `MemoBody.tsx` component already does this — S2 just emits the tags.

## Normalizer behaviour

```
1. For each entry in output.new_citations:
     INSERT Citation
       displayId = next "cN" for this dealId
       documentId, chunkId, sectionRef, page, excerpt, confidence from entry
     Build map newCitationIdMap: { tmp_ref → "cN" }

2. For each section in output.sections:
     body' = body
     for each [new_K] in body': body' = body'.replace("[new_K]", "[" + newCitationIdMap[new_K] + "]")
     Validate: every [cN] in body' exists in (existing_citations ∪ new_citations);
                every [rfN] exists in existing_findings.
       If not → ABORT and surface error to S2 retry loop.

3. UPSERT Memo (dealId)
     status = output.memo_status
     reviewProgress = output.review_progress
     pendingItems = output.pending_items
     runId = ctx.runId

4. For each section:
     UPSERT MemoSection (memoId, sectionKey)
       title, body=body', reviewed=section.reviewed,
       orderIdx = ['thesis','snapshot','risks','questions','recommendation']
                    .indexOf(sectionKey)
     SET citation relation: every cN in citations_used → MemoSectionCitations
     UPDATE Citation.usedIn: append section_key for each cN in citations_used
       (and for each rfN, append "rf" + N)
```

## Feature coverage

- 100% of "IC memo with sourced citations" + "exportable report".
- PDF export = a separate route handler that renders the 5 sections via `@react-pdf/renderer`.
