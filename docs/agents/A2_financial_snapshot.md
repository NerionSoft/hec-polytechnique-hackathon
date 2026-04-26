# A2 — Financial Snapshot

**Stage:** 1 (parallel)
**Model:** `gemini-3-flash` (temperature 0)
**Wall-clock target:** 2–4 min

## Role

Senior PE financial analyst. Produces the standardized 3-year financial snapshot of the target. Output drives **two** kinds of persistence:

1. **Cache columns on `Deal`** — for fast kanban queries (revenue, ebitda, growth, etc.).
2. **`FinancialSnapshot`** rows — pre-shaped JSON the front renders 1:1 (`trendJson`, `kpiJson`, `workingCapitalJson`).

## Retrieval scope

Documents with `peTaxonomy` containing any of:

- `financial.audit`, `financial.budget`, `financial.ar_aging`, `operations.kpi`
- `governance.board` (financial sections only)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Senior PE financial analyst. Produce the standardized 3-year
financial snapshot of the target.

OUTPUT SCHEMA (JSON only, returned via tool `submit_financial_snapshot`):
{
  "period_covered": {"from":"FY20XX","to":"FY20XX"},
  "currency": "USD"|"EUR"|"GBP",

  // ────── Niveau 1 : audit / replay (riche) ──────
  "p_and_l": {
    "revenue":          [{"period":"FY2023","value":87500000,"source_type":"audit","evidence":[...]}],
    "revenue_by_segment":[{"period":"FY2023","segment":"Enterprise Solutions","value":52500000,"evidence":[...]}],
    "gross_profit":     [...],
    "gross_margin_pct": [...],
    "ebitda":           [...],
    "ebitda_margin_pct":[...],
    "ebit":             [...],
    "net_income":       [...]
  },
  "balance_sheet": {
    "total_assets":[...], "cash":[...], "total_debt":[...],
    "working_capital":[...], "current_ratio":[...]
  },
  "cash_flow": { "operating_cf":[...], "capex":[...], "fcf":[...] },
  "growth_kpis": {
    "yoy_revenue_growth_pct":[...], "headcount":[...],
    "client_count":[...], "retention_rate_pct":[...]
  },

  // ────── Niveau 2 : vues pré-mâchées pour le front ──────
  "deal_kpi_sync": {
    // Persisted directly to Deal columns
    "revenue_eur":      <number|null>,    // most recent audited FY
    "ebitda_eur":       <number|null>,
    "ebitda_margin":    <number|null>,    // 0-1 (NOT %)
    "growth_yoy":       <number|null>,    // 0-1
    "net_debt_ebitda":  <number|null>,
    "employees":        <integer|null>,
    "founded":          <integer|null>,
    "evidence": [...]
  },
  "trend_view": [
    // Persisted directly to FinancialSnapshot.trendJson
    {"period":"FY24","revenue_m":31.0,"ebitda_m":4.2,"evidence":[...]}
  ],
  "working_capital_view": [
    // Persisted directly to FinancialSnapshot.workingCapitalJson
    {"period":"FY24","dso":68,"dpo":47,"dio":44,"evidence":[...]}
  ],
  "kpi_view": {
    // Persisted to FinancialSnapshot.kpiJson — single object
    "revenue_m":31.0, "ebitda_m":4.2, "ebitda_margin":0.135,
    "growth_yoy":0.18, "net_debt_ebitda":3.4,
    "headcount":142, "client_count":40,
    "evidence": [...]
  },

  "trend_commentary": "<≤ 3 sentences, factual only, no opinion>",
  "gaps": [...]
}

RULES:
- Pull EVERY number from the docs. Missing periods → null + gap.
- Multiple sources for the same metric → keep the AUDITED version,
  flag any budget version with `source_type:"budget"`.
- Conflicts (>2% disagreement on audited) → both with conflict:true.
- Computed metrics (margin, growth) only when numerator & denominator
  are both stated. Otherwise null + gap.
- `deal_kpi_sync.ebitda_margin` and `growth_yoy` are RATIOS (0-1), not %.
- `revenue_m` / `ebitda_m` are values DIVIDED BY 1,000,000 (display-friendly).
- `trend_commentary`: factual only. Forbidden: "strong", "concerning", etc.
```

## Source priority order

1. Audited annual statements (highest trust)
2. Internal management accounts
3. Board pack financials
4. Budget / projection (`source_type: "budget"`, never displaces audited actuals)

## Conflict handling

```json
{
  "period": "FY2023",
  "value": null,
  "conflict": true,
  "candidates": [
    {"value": 87500000, "evidence": [...]},
    {"value": 87200000, "evidence": [...]}
  ],
  "gap": {
    "field": "revenue.FY2023",
    "reason": "two audited sources disagree by >2%",
    "suggested_request": "Confirm reconciliation between annual-audit-2023 §2.2 and board-pack-q4-2023 §3.1"
  }
}
```

## Normalizer behaviour

```
A2 output  →  A2.normalizer
              ├─► UPDATE Deal SET (revenueEur, ebitdaEur, ebitdaMargin,
              │                    growthYoy, netDebtEbitda, employees, founded)
              │   = output.deal_kpi_sync
              └─► UPSERT FinancialSnapshot (dealId)
                    .trendJson           = output.trend_view
                    .workingCapitalJson  = output.working_capital_view
                    .kpiJson             = output.kpi_view
              (bridgeJson, concentrationJson, retentionJson stay null —
               filled by A4 / A5 normalizers in their own steps)
```

## Feature coverage

- 100% of "Financial snapshot" feature.
- Caveat: numbers as stated by management — A3 (QoE) re-tests their quality.
