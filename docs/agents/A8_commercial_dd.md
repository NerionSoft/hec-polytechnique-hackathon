# A8 — Commercial DD

**Stage:** 1 (parallel)
**Model:** `gemini-3-flash` (temperature 0.1)
**Wall-clock target:** 2–4 min

## Role

Commercial DD analyst. Produces the open-question list and a factual market-position summary **based on docs only**.

## Persists to (via normalizer)

- `ManagementQuestion[]` rows — `topic = COMMERCIAL`, `agentId = "A8"`
- `Finding[]` rows ONLY when a doc-grounded weakness is found (rare for A8) — `category = COMMERCIAL`

## Retrieval scope

- `commercial.market_study`
- `customer.contract.*`
- `operations.kpi`
- `financial.budget` (segment forecasts)
- `governance.board` (strategy decks)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Commercial DD analyst. Produce the question list AND the factual
market position summary BASED ON DOCS ONLY.

OUTPUT SCHEMA (JSON only, tool `submit_commercial`):
{
  "factual_position": {
    "stated_market":"<verbatim from a doc>",
    "stated_market_size_eur":<number|null>,
    "stated_growth_rate_pct":<number|null>,
    "stated_competitors":["..."],
    "stated_differentiators":["..."],
    "evidence":[...]
  },
  "doc_grounded_thesis_signals": [
    {"signal":"<e.g. 'EU clients accelerating'>","evidence":[...]}
  ],
  "open_commercial_questions": [
    {
      "external_id":"CDD-001",
      "question":"<precise, answerable question>",
      "why_it_matters":"<≤ 1 sentence>",
      "subcategory":"market_size"|"win_rate"|"churn"|"unit_economics"|
                    "competitive_pressure"|"pricing_power"|"go_to_market"|
                    "regulatory_tailwind"|"product_roadmap",
      "ideal_evidence_to_request":"<doc type to ask for>",
      "linked_redflag_external_id":"<external_id from another agent if any>"
    }
  ],

  "commercial_findings": [
    // Use ONLY when the doc itself contains a clear commercial weakness
    // (e.g., declining win rate explicitly stated). Else empty array.
    {
      "external_id":"COM-001",
      "severity":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
      "category":"COMMERCIAL",
      "title":"...",
      "summary":"<≤ 1 sentence>",
      "detail":"<≤ 4 sentences>",
      "confidence":"HIGH"|"MEDIUM"|"LOW",
      "impact":"<consequence>",
      "primary_evidence_index":0,
      "evidence":[...],
      "management_question":"...",
      "deal_impact":"information_only"|"price_chip"|"reps_warranties"
    }
  ],
  "gaps":[...]
}

RULES:
- `factual_position` must be 100% sourced. If "market size" not in any
  doc, set null + gap. NEVER pull a market size from training data.
- `doc_grounded_thesis_signals` are positive signals — same citation rules.
- `open_commercial_questions` are EXPECTED to lack evidence (they exist
  BECAUSE evidence is missing). They do NOT need an `evidence` array.
- A good open question:
    - names a metric or fact (not a feeling)
    - could be answered with a single document or table
    - carries a `why_it_matters` tied to a thesis pillar or risk
    - is mutually exclusive with other questions
- `commercial_findings`: emit ONLY when the doc explicitly states the issue.
  No inference, no benchmarks.
```

## Default question template (when VDR is sparse)

If the VDR has no commercial documents, A8 still emits a baseline question set covering the 9 subcategories. Each baseline question carries `gap: "no_commercial_docs_in_vdr"`.

## Normalizer behaviour

```
1. For each q in output.open_commercial_questions:
     INSERT ManagementQuestion
       displayId = next "qN"
       topic     = "COMMERCIAL"
       body      = q.question
       raisedBy  = "ai"
       (no derivedFromFindingId unless q.linked_redflag_external_id resolves
        to an existing Finding within this run)
2. For each f in output.commercial_findings:
     UPSERT Citation rows from f.evidence
     INSERT Finding (displayId rfN, agentId="A8", category="COMMERCIAL",
                     primaryCitationId from primary_evidence_index)
     INSERT ManagementQuestion (displayId qN, topic="COMMERCIAL",
                                 derivedFromFindingId=<above>)
```

## Feature coverage

- 60% of "Commercial DD" — the rest needs primary research (expert calls, customer interviews) outside the VDR.
