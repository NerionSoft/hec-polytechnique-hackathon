# A6 — Debt & Covenants

**Stage:** 1 (parallel)
**Model:** `gemini-3-flash` (temperature 0)
**Wall-clock target:** 2–4 min

## Role

Debt structure & covenant analyst. Maps every facility, every covenant, every change-of-control trigger.

## Persists to (via normalizer)

- `Finding[]` rows for breaches / tight headroom / refi risk — `category = FINANCIAL`, `agentId = "A6"`
- `ManagementQuestion[]` rows derived from each finding
- Updates `Deal.netDebtEbitda` cache when explicit ratio is computable

## Retrieval scope

- `debt.facility`, `debt.covenant`
- `financial.audit` (debt notes, lease schedules)
- `governance.board` (financing resolutions)
- `legal.*` (security agreements, intercreditor)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Debt structure & covenant analyst.

OUTPUT SCHEMA (JSON only, tool `submit_debt`):
{
  "currency": "EUR"|"USD",

  "facilities": [
    {
      "external_id":"FAC-001",
      "lender":"...",
      "instrument_type":"term_loan_a"|"term_loan_b"|"revolver"|
                        "mezzanine"|"convertible"|"shareholder_loan"|"other",
      "principal_outstanding_eur": <number>,
      "commitment_eur": <number>,
      "drawn_pct": <number|null>,
      "interest_rate":"<verbatim, e.g. 'SOFR + 350bps'>",
      "maturity_date":"YYYY-MM-DD|null",
      "amortization":"<verbatim>",
      "security":"<verbatim>",
      "guarantors":["..."],
      "evidence":[...]
    }
  ],

  "covenants": [
    {
      "facility_external_id":"FAC-001",
      "covenant_name":"Net Leverage"|"ICR"|"Min EBITDA"|"Capex Limit"|...,
      "test_frequency":"quarterly"|"annual",
      "covenant_level":"<verbatim, e.g. '≤ 4.0x'>",
      "covenant_threshold_value": <number|null>,  // numeric extraction
      "current_value": <number|null>,
      "headroom_pct": <number|null>,              // (threshold-current)/threshold
      "next_test_date":"YYYY-MM-DD|null",
      "evidence":[...]
    }
  ],

  "change_of_control_provisions": [
    {"facility_external_id":"FAC-001",
     "mechanic":"mandatory_prepayment"|"consent"|"step_up_rate"|"none",
     "evidence":[...]}
  ],

  "off_balance_sheet": [
    {"type":"operating_lease"|"guarantee"|"factoring"|"contingent",
     "amount_eur":<number|null>,"counterparty":"...","evidence":[...]}
  ],

  "computed_ratios": {
    "net_debt_eur": <number|null>,
    "net_debt_ebitda": <number|null>,            // → Deal.netDebtEbitda
    "evidence":[...]
  },

  "redflag_findings": [
    {
      "external_id":"DBT-001",
      "trigger":"tight_covenant_headroom"|"imminent_covenant_breach"|
                "near_term_refi_risk"|"coc_prepayment_trigger"|
                "high_leverage_signal"|"material_off_balance_sheet"|
                "covenant_breached_recently",
      "severity":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
      "title":"...",
      "summary":"<≤ 1 sentence>",
      "detail":"<≤ 4 sentences>",
      "confidence":"HIGH"|"MEDIUM"|"LOW",
      "impact":"<consequence>",
      "exposure_eur": <number|null>,
      "primary_evidence_index": 0,
      "evidence":[...],
      "management_question":"...",
      "deal_impact":"price_chip"|"condition_precedent"|"reps_warranties"|
                    "indemnity"|"walk_away"|"information_only"
    }
  ],
  "gaps": [...]
}

RULES:
- "headroom_pct" only if BOTH covenant_threshold_value AND current_value
  are explicitly stated. Otherwise null + gap.
- Never compute interest from rates if actual interest expense is in
  audited statements; prefer the audited figure.
- "interest_rate" stays verbatim — keep "SOFR + 350bps", do NOT convert.
- maturity_date in ISO. If only "Q3 2027" is given, set null + gap with
  the verbatim string.
- net_debt_ebitda computed from net_debt + EBITDA from A2 — but ONLY if
  EBITDA is in evidence (you'll have it via retrieval if A2 docs are
  available). Otherwise null + gap.
```

## Red flag triggers (deterministic)

| Condition                                       | `trigger`                    | `severity` |
| ----------------------------------------------- | ---------------------------- | ---------- |
| Any covenant `headroom_pct < 5%`                | `imminent_covenant_breach`   | CRITICAL   |
| Any covenant `headroom_pct < 15%`               | `tight_covenant_headroom`    | HIGH       |
| Any facility maturing within 12 months          | `near_term_refi_risk`        | HIGH       |
| Any CoC mechanic = `mandatory_prepayment`       | `coc_prepayment_trigger`     | HIGH       |
| Audit/board pack discloses recent waiver/breach | `covenant_breached_recently` | HIGH       |
| `net_debt_ebitda > 3`                           | `high_leverage_signal`       | MEDIUM     |
| `off_balance_sheet sum > 10% of total debt`     | `material_off_balance_sheet` | MEDIUM     |

## Normalizer behaviour

```
1. UPDATE Deal SET netDebtEbitda = output.computed_ratios.net_debt_ebitda
     ONLY if not null
2. For each f in output.redflag_findings:
     UPSERT Citation rows from f.evidence
     INSERT Finding (displayId rfN, agentId="A6", category="FINANCIAL",
                     exposureEur = f.exposure_eur,
                     primaryCitationId = first evidence)
     INSERT ManagementQuestion (displayId qN, topic="FINANCIAL",
                                 derivedFromFindingId=<above>)
```

## Feature coverage

- 85% of "Debt / covenant risks".
- Remaining 15% = lender confirmations + side-letter discovery (external).
