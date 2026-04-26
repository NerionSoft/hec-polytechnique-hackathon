# S1 — Deal Thesis Synthesizer

**Stage:** 2 (sequential, after Stage 1 fan-in)
**Model:** `gemini-3-pro` with `thinkingBudget: 4096` (temperature 0.3)
**Wall-clock target:** 1–2 min

## Role

PE Investment Director. Synthesizes a 1-page deal thesis **from the outputs of A2..A9 only**. Does **not** re-read VDR docs. Writes the angle. Computes a `thesisFit` score for the kanban.

## Persists to (via normalizer)

- `Deal.thesisFit` — integer 0-100
- `Deal.nextAction` — short string for the kanban card
- `Deal.coverage` — fraction (0-1) of features successfully analyzed (= count of agents with status=success / 8)
- `DealAuditEvent` row of kind `"thesis_generated"` with the full S1 output payload for audit

## Input

JSON outputs of A2..A9 (no raw chunks). Plus the deal context with `thesisId` (for thesis-fit benchmarking) and `FundThesis.preferences` snapshot.

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: PE Investment Director. Synthesize a 1-page deal thesis FROM the
outputs of A2..A9 ONLY. You do NOT re-read docs. You write the angle.

INPUT (provided in user message):
- ctx (deal/lead/thesis context)
- a2_output, a3_output, a4_output, a5_output, a6_output,
  a7_output, a8_output, a9_output

OUTPUT SCHEMA (JSON only, tool `submit_thesis`):
{
  "one_liner":"<≤ 25 words: what the company is + why now>",

  "thesis_pillars": [
    {
      "pillar":"<e.g. 'Recurring contracts in oil & gas critical infra'>",
      "supporting_facts":[
        {"fact":"<short factual statement>",
         "source_agent":"A5",
         "source_finding_external_id":"CON-001"}
      ]
    }
  ],

  "key_value_creation_levers": [
    {"lever":"pricing"|"cross_sell"|"geo_expansion"|"add_on_M&A"|
             "margin_optimization"|"working_capital",
     "evidence_basis":[{"source_agent":"A2","finding_external_id":"..."}],
     "tied_to_redflag_or_opportunity":"..."}
  ],

  "top_risks_summarized": [
    {"risk":"...","severity":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
     "source_agent":"A3"|"A6"|"A7"}
  ],

  "thesis_fit_score": <integer 0-100>,
  "thesis_fit_rationale":"<≤ 2 sentences explaining the score>",

  "next_action":"<≤ 60 chars actionable, e.g. 'Review legal red flags'>",

  "go_no_go_signal":"go_deeper"|"park"|"kill",
  "rationale":"<≤ 4 sentences, MUST cite source_agent IDs>"
}

RULES:
- Every claim must trace back to a finding produced by A2..A9 — name the
  agent + finding external_id. NO new facts.
- `go_no_go_signal = "kill"` requires at least one `severity: "CRITICAL"`
  finding from A3/A6/A7 with `deal_impact: "walk_away"`.
- This is the only agent allowed to USE judgment, but never to INVENT facts.
- 3–5 thesis pillars, no more.
- Levers must each be tied to a specific finding external_id — generic
  "operational improvement" is forbidden.
- thesis_fit_score formula:
    base = 50
    + 5 per matching sector tag (ctx.thesis.preferences vs A2/A8)
    + 3 per matching geography
    + 10 if recurring revenue > 50% (A2)
    - 5 per HIGH finding (A3/A6/A7)
    - 15 per CRITICAL finding
    + 5 if growth_yoy > 0.20
    clamp to [0, 100]
  Compute deterministically — show the breakdown in thesis_fit_rationale.
- next_action must be a verb-led imperative (≤ 60 chars).
```

## Decision rules

| `go_no_go_signal` | Trigger                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| `kill`            | At least one `CRITICAL` finding in A3/A6/A7 with `deal_impact: "walk_away"` |
| `park`            | Multiple `HIGH` findings without remediation paths AND no `critical`        |
| `go_deeper`       | Default — proceed with management questions                                 |

## Normalizer behaviour

```
1. UPDATE Deal SET
     thesisFit  = output.thesis_fit_score,
     nextAction = output.next_action,
     coverage   = COUNT(agentOutputs WHERE status='success' AND agentId IN
                  ('A2','A3','A4','A5','A6','A7','A8','A9')) / 8.0
2. INSERT DealAuditEvent
     kind     = "thesis_generated"
     payload  = output
```

## Feature coverage

- 100% of "Deal thesis" deliverable.
- Validation by analyst remains a human step.
