# A4 — EBITDA Bridge / Adjustments

**Stage:** 1 (parallel)
**Model:** `gemini-3-flash` (temperature 0)
**Wall-clock target:** 2–3 min

## Role

Builds the EBITDA normalization bridge: reported → adjusted EBITDA. Produces the bridge view that the front renders 1:1 in the EBITDA bridge chart.

## Persists to (via normalizer)

- `FinancialSnapshot.bridgeJson` — the pre-rendered bridge array
- Optional `Finding[]` rows when an adjustment is itself a red flag (e.g., aggressive add-back) — `category = FINANCIAL`, `agentId = "A4"`

## Retrieval scope

- `financial.audit`, `financial.budget`
- `hr.key_person` (severance, bonuses, owner comp)
- `legal.litigation` (settlements)
- `operations.*` (one-off projects, restructuring)
- `governance.board` (board-approved one-offs)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Build the EBITDA normalization bridge: reported → adjusted EBITDA.

OUTPUT SCHEMA (JSON only, tool `submit_ebitda_bridge`):
{
  "currency": "EUR"|"USD"|"GBP",
  "reported_ebitda": {"period":"FY2024","value_eur":4200000,"evidence":[...]},

  "adjustments": [
    {
      "external_id": "ADJ-001",
      "label": "Owner compensation normalization",
      "category": "owner_comp"|"non_recurring_legal"|"covid_related"|
                  "one_off_project"|"related_party"|"rent_normalization"|
                  "stock_comp"|"restructuring"|"other",
      "direction": "add_back"|"deduction",
      "amount_eur": <number>,
      "is_quantified_in_source": true|false,
      "rationale": "<≤ 2 sentences>",
      "confidence": "HIGH"|"MEDIUM"|"LOW",
      "evidence": [...],
      "management_question": "<verification question>",
      "is_aggressive": true|false,        // flag for A3 cross-ref / Finding emission
      "bridge_view_type": "addition"|"warning"  // 'warning' iff is_aggressive=true OR confidence=LOW
    }
  ],

  "adjusted_ebitda_eur": <number|null>,
  "adjusted_ebitda_margin": <number|null>,  // 0-1, null if revenue not in scope

  // Pre-rendered for FinancialSnapshot.bridgeJson
  "bridge_view": [
    {"label":"Reported EBITDA","value":4.2,"type":"base"},
    {"label":"COVID restruct.","value":0.9,"type":"addition","note":"Questionable in 2024"},
    {"label":"Consulting fees","value":0.7,"type":"warning","note":"Recurring 3 years in a row"},
    {"label":"Pre-IPO costs","value":0.5,"type":"warning","note":"No IPO planned"},
    {"label":"Adjusted EBITDA","value":6.3,"type":"total"}
  ],
  "gaps": [...]
}

RULES:
- An adjustment is ONLY valid if its amount is either (a) explicitly stated
  in a doc, or (b) computable from two explicit doc numbers. NO benchmarks.
- If management proposes an adjustment but the underlying number is not
  documented:
    is_quantified_in_source: false, confidence: "LOW",
    amount_eur: null, plus an MMQ.
- `confidence: "HIGH"` requires an audited source.
- `bridge_view` values are in MILLIONS (divide by 1,000,000). Reported and
  adjusted MUST be the first and last entries respectively.
- adjusted_ebitda_eur = reported.value + sum(add_back) - sum(deduction),
  computed from non-null amounts only. If any required amount is null →
  adjusted_ebitda_eur: null + gap.
- `is_aggressive` = true when the adjustment looks like recurring opex
  dressed as one-off (consulting fees recurring 3y, "pre-IPO" costs with
  no IPO, etc.). Triggers Finding emission by the normalizer.
```

## Confidence rubric

| `Confidence` | Trigger                                                         |
| ------------ | --------------------------------------------------------------- |
| `HIGH`       | Audited statement explicitly identifies AND quantifies the line |
| `MEDIUM`     | Internal management account quantifies it; not audited          |
| `LOW`        | Item identified but amount inferred or merely proposed          |

## Normalizer behaviour

```
1. UPSERT FinancialSnapshot (dealId)
     .bridgeJson = output.bridge_view  (the front consumes this verbatim)
2. For each adj in output.adjustments WHERE is_aggressive == true:
     INSERT Finding
       displayId = next "rfN"
       category = "FINANCIAL"
       agentId = "A4"
       severity = adj.confidence == "LOW" ? "HIGH" : "MEDIUM"
       title = "Aggressive add-back — " + adj.label
       summary = adj.rationale
       confidence = adj.confidence
       impact = "Adjusted EBITDA may be overstated by ~" + adj.amount_eur
       suggestedQuestion = adj.management_question
       evidence → Citation rows
3. UPDATE Deal SET ebitdaEur = output.adjusted_ebitda_eur
   ONLY if adjusted_ebitda_eur is not null AND > 0
```

## Common categories — what to look for

- **owner_comp**: founder/CEO above market — only adjust if "above-market" is documented (comp committee minutes).
- **non_recurring_legal**: settlements, one-off counsel fees — must tie to a specific matter.
- **one_off_project**: ERP migration, etc. — needs project doc + dates.
- **related_party**: rent above market to related lessor; off-market intercompany.
- **stock_comp**: SBC add-back is sector-dependent; flag direction only if explicit policy is documented.
- **restructuring**: severance bursts, plant closures.

## Feature coverage

- 70% automatable.
- Remaining 30% = judgment-based add-backs (synergy, run-rate, pro-forma) needing PE-team input.
