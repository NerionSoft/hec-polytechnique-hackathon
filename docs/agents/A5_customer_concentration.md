# A5 — Customer Concentration

**Stage:** 1 (parallel)
**Model:** `gemini-3-flash` (temperature 0)
**Wall-clock target:** 2–4 min

## Role

Customer concentration & contract-quality analyst. Quantifies revenue dependency, surfaces contract-level deal risks (CoC, termination, churn).

## Persists to (via normalizer)

- `FinancialSnapshot.concentrationJson` — front-shaped array
- `FinancialSnapshot.retentionJson` — single object (NRR/GRR/churn)
- `Finding[]` rows when concentration thresholds are breached — `category = COMMERCIAL`, `agentId = "A5"`

## Retrieval scope

- `customer.contract.tier1`, `customer.contract.tier2`
- `financial.audit` (revenue mix sections)
- `financial.budget` (segment forecasts)
- `commercial.market_study`

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Customer concentration & contract-quality analyst.

OUTPUT SCHEMA (JSON only, tool `submit_concentration`):
{
  "as_of_date": "<YYYY-MM-DD from doc>",
  "currency": "EUR"|"USD",
  "total_revenue_eur": <number>,

  // ────── Niveau 1 : audit / replay ──────
  "concentration": {
    "top_1_pct": <number>, "top_3_pct": <number>,
    "top_5_pct": <number>, "top_10_pct": <number>,
    "evidence": [...]
  },
  "tier_breakdown": [
    {"tier":"T1","threshold_eur":2000000,"client_count":N,"total_eur":...,
     "share_of_revenue_pct":...,"evidence":[...]}
  ],
  "contracts": [
    {
      "client_id_or_name": "<as in doc, redact only if doc redacts>",
      "industry": "...",
      "annual_value_eur": <number>,
      "term_start": "YYYY-MM-DD", "term_end": "YYYY-MM-DD",
      "remaining_months": <number|null>,
      "auto_renewal": true|false|null,
      "termination_for_convenience_days": <number|null>,
      "change_of_control_clause": "consent_required"|"notice_only"|
                                   "none"|"unknown",
      "exclusivity": true|false|null,
      "mfn_clause": true|false|null,
      "sla_penalties_pct_revenue": <number|null>,
      "evidence": [...]
    }
  ],
  "churn_signals": [
    {"client":"...","signal":"non-renewal notice"|"scope reduction"|
     "litigation"|"price concession","evidence":[...]}
  ],

  // ────── Niveau 2 : vues pré-mâchées pour le front ──────
  "concentration_view": [
    {"name":"Carrefour","share":0.31,"flag":true,"evidence":[...]},
    {"name":"Auchan","share":0.19,"flag":false,"evidence":[...]},
    {"name":"Pernod Ricard","share":0.14,"flag":false,"evidence":[...]},
    {"name":"Other (37)","share":0.36,"flag":false}
  ],
  "retention_view": {
    "period":"FY24","nrr":1.08,"grr":0.92,"churn":0.08,"evidence":[...]
  },

  "redflag_findings": [
    {
      "external_id":"CON-001",
      "trigger":"top1_>20pct"|"top3_>40pct"|"coc_consent_top5"|
                "near_term_expiry_top5"|"unilateral_termination_top5"|
                "top10_>60pct",
      "severity":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
      "title":"...",
      "summary":"<≤ 1 sentence>",
      "detail":"<≤ 4 sentences>",
      "confidence":"HIGH"|"MEDIUM"|"LOW",
      "impact":"<consequence>",
      "primary_evidence_index":0,
      "evidence":[...],
      "management_question":"...",
      "deal_impact":"price_chip"|"condition_precedent"|"reps_warranties"|
                    "indemnity"|"information_only"
    }
  ],
  "gaps": [...]
}

RULES:
- For change_of_control: read the actual clause. No clause found → "unknown" + gap.
- Coded client IDs (e.g., "T1-2023-001") stay as-is. Never invent a name.
- `concentration_view`:
    - sort by share desc
    - cap at top 5 + "Other (N)" aggregate
    - `flag: true` iff share > 0.20
    - shares are FRACTIONS (0-1), not %
- `retention_view.churn` = 1 - grr
- Concentration percentages require `total_revenue_eur` from a single
  audited source. If multiple, use the most recent audited.
- Emit one redflag_finding per breached threshold.
```

## Red flag thresholds (deterministic)

| Threshold                                                            | `trigger`                     | `severity` |
| -------------------------------------------------------------------- | ----------------------------- | ---------- |
| `top_1_pct > 20%`                                                    | `top1_>20pct`                 | HIGH       |
| `top_3_pct > 40%`                                                    | `top3_>40pct`                 | HIGH       |
| Top-5 contract with `change_of_control_clause == "consent_required"` | `coc_consent_top5`            | HIGH       |
| Top-5 contract with `remaining_months < 6`                           | `near_term_expiry_top5`       | HIGH       |
| Top-5 contract with `termination_for_convenience_days <= 30`         | `unilateral_termination_top5` | HIGH       |
| `top_10_pct > 60%`                                                   | `top10_>60pct`                | MEDIUM     |

## Normalizer behaviour

```
1. UPSERT FinancialSnapshot (dealId)
     .concentrationJson = output.concentration_view
     .retentionJson     = output.retention_view
2. For each f in output.redflag_findings:
     UPSERT Citation rows from f.evidence
     INSERT Finding (displayId rfN, agentId="A5", category="COMMERCIAL",
                     primaryCitationId from primary_evidence_index)
     INSERT ManagementQuestion (displayId qN, topic="COMMERCIAL",
                                 derivedFromFindingId=<above>)
```

## Feature coverage

- 95% of "Customer concentration".
- Remaining 5% = external verification (calling references) — out of scope.
