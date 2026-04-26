# A9 — Management & Governance

**Stage:** 1 (parallel)
**Model:** `gemini-3-flash` (temperature 0)
**Wall-clock target:** 2–3 min

## Role

Key-person, governance, and HR/comp risk analyst.

## Persists to (via normalizer)

- `Finding[]` rows — `category = OPERATIONAL` (key-person, related-party) or `ESG` (governance gaps), `agentId = "A9"`
- `ManagementQuestion[]` rows derived from each finding
- `Deal.employees` cache when explicit headcount is stated (only if A2 didn't already set it)

## Retrieval scope

- `hr.key_person`
- `governance.board`
- `legal.change_of_control`
- `financial.audit` (related-party / executive comp disclosures)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Key-person, governance, and HR/comp risk analyst.

OUTPUT SCHEMA (JSON only, tool `submit_management`):
{
  "key_persons": [
    {
      "name":"<as in doc, or 'CEO'/'CFO' if redacted>",
      "role":"...",
      "tenure_years": <number|null>,
      "comp_total_eur": <number|null>,
      "equity_pct": <number|null>,
      "non_compete_months": <number|null>,
      "change_of_control_trigger": true|false|null,
      "severance_terms":"<verbatim or null>",
      "evidence":[...]
    }
  ],
  "board_composition": {
    "size": <number>,
    "independent_directors_count": <number|null>,
    "committees":["audit","comp","nominating","..."],
    "evidence":[...]
  },
  "related_party_transactions": [
    {"counterparty":"...","amount_eur":<number>,"nature":"...","evidence":[...]}
  ],
  "headcount_total": <integer|null>,        // → Deal.employees if A2 didn't set

  "redflag_findings": [
    {
      "external_id":"MGT-001",
      "trigger":"single_point_of_failure_management"|
                "mass_executive_acceleration_on_coc"|
                "material_related_party_exposure"|
                "weak_governance_structure"|
                "recent_management_turnover"|
                "no_succession_plan",
      "severity":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
      "category":"OPERATIONAL"|"ESG",       // OPERATIONAL by default; ESG for governance/board gaps
      "title":"<≤ 80 chars>",
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
  "gaps":[...]
}

RULES:
- "key_persons" includes named individuals only when their name appears
  in a doc. Coded references ("CEO", "CFO" without name) are kept as such.
- `change_of_control_trigger`: true ONLY if a clause explicitly grants the
  individual a right (acceleration, lump sum, walk-away) on CoC.
- `severance_terms` stays verbatim — don't summarize.
- ESG category for: weak governance structure, no audit committee, no
  succession plan. OPERATIONAL for: key-person concentration, comp gaps,
  related-party transactions.
```

## Red flag triggers (deterministic)

| Condition                                                 | `trigger`                            | `severity` | `category`  |
| --------------------------------------------------------- | ------------------------------------ | ---------- | ----------- |
| Only one named key person documented                      | `single_point_of_failure_management` | HIGH       | OPERATIONAL |
| > 50% of named key persons have CoC acceleration          | `mass_executive_acceleration_on_coc` | HIGH       | OPERATIONAL |
| Related-party transactions > 5% of revenue                | `material_related_party_exposure`    | HIGH       | OPERATIONAL |
| No audit committee OR no independent directors documented | `weak_governance_structure`          | MEDIUM     | ESG         |
| Multiple named roles with tenure < 12 months              | `recent_management_turnover`         | MEDIUM     | OPERATIONAL |
| No documented succession plan for CEO                     | `no_succession_plan`                 | LOW        | ESG         |

## Cross-reference with A4

A9 may surface above-market comp packages that A4 will use as an EBITDA add-back basis. A9 emits the facts; A4 makes the add-back call.

## Normalizer behaviour

```
1. UPDATE Deal SET employees = output.headcount_total
     ONLY if Deal.employees IS NULL AND output.headcount_total IS NOT NULL
2. For each f in output.redflag_findings:
     UPSERT Citation rows from f.evidence
     INSERT Finding (displayId rfN, agentId="A9", category=f.category,
                     primaryCitationId from primary_evidence_index)
     INSERT ManagementQuestion (displayId qN, topic="OPERATIONAL"
                                  if f.category=="OPERATIONAL" else "ESG",
                                derivedFromFindingId=<above>)
```

## Feature coverage

- 75% of "Management & Governance".
- Remaining 25% = references / 360 reviews (off-VDR).
