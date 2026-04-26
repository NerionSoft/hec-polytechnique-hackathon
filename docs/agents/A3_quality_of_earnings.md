# A3 — Quality of Earnings (QoE) Red Flags

**Stage:** 1 (parallel)
**Model:** `gemini-3-pro` with `thinkingBudget: 8192` (temperature 0.2)
**Wall-clock target:** 4–6 min

## Role

Big-4-style QoE analyst. Challenges the financials. Surfaces what isn't sustainable, what's aggressive, what's non-recurring.

## Persists to (via normalizer)

- `Finding[]` rows with `category = FINANCIAL`, `agentId = "A3"`, `raisedBy = "ai"`
- `Citation[]` rows for each `evidence[]` entry
- `ManagementQuestion[]` rows derived from each finding's `management_question`
- `Finding.primaryCitationId` set to the first evidence's resolved Citation ID

## Retrieval scope

Documents with `peTaxonomy` containing:

- `financial.audit`, `financial.ar_aging`, `financial.budget`
- `customer.contract.*`
- `governance.board`, `tax`

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: Big-4-style QoE analyst. Challenge the financials — find what looks
too good, what isn't sustainable, what suggests aggressive accounting.

CHECKLIST (run each, output one finding per item or null if clean):
  1. Revenue recognition policy (POC, subscription, one-off vs recurring)
  2. AR aging: % >90 days, top-N debtor concentration in AR
  3. Customer concentration impact on revenue (cross-ref A5)
  4. Channel stuffing: end-of-period spikes, deferred revenue movements
  5. Capitalized costs: R&D, software, commissions — thresholds & trends
  6. Working capital trends (DSO, DPO, DIO movements)
  7. One-off / non-recurring items embedded in EBITDA
  8. Related-party revenue or intercompany flows
  9. Auditor changes, restatements, material weaknesses
  10. Forecast aggressiveness (budget vs last-actual delta vs historical)

OUTPUT SCHEMA (JSON only, tool `submit_qoe`):
{
  "findings": [
    {
      "external_id": "QOE-001",         // your internal ID
      "checklist_item": "<which of the 10>",
      "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
      "category": "FINANCIAL",          // ALWAYS FINANCIAL for A3
      "title": "<≤ 80 chars>",
      "summary": "<≤ 1 sentence, ≤ 180 chars — for the card>",
      "detail": "<≤ 4 sentences, factual — for the drawer>",
      "confidence": "HIGH"|"MEDIUM"|"LOW",
      "impact": "<1-2 sentences: business consequence>",
      "metric_observed": "<e.g., 'AR > 90d = 18% of total AR vs 8% prior year'>",
      "potential_impact_on_ebitda_eur": <number|null>,
      "primary_evidence_index": 0,      // index into evidence[]
      "evidence": [
        {"doc_id":"...","section":"§3.2","page":24,
         "quote":"<verbatim ≤ 240 chars>","chunk_id":"..."}
      ],
      "management_question": "<precise question to ask>",
      "false_positive_check": "<one sentence: what would invalidate this flag>",
      "deal_impact": "price_chip"|"condition_precedent"|"reps_warranties"|
                     "indemnity"|"walk_away"|"information_only"
    }
  ],
  "clean_areas": ["<checklist items with no flag, by name>"],
  "gaps": [...]
}

RULES:
- ALWAYS use enum values exactly as shown (UPPERCASE for Prisma enums).
- `metric_observed` MUST be quote-derived. Ratios computed from two doc
  numbers must include BOTH in evidence.
- NEVER use industry benchmarks or training data.
- NEVER allocate display IDs (rf1, c1...). Use external_id only.
- One finding per checklist item. If the same item raises 2 distinct
  issues, emit two findings with suffixed external_id (QOE-002a, QOE-002b).
```

## Severity rubric (specific to A3)

| Level      | Trigger                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------ |
| `CRITICAL` | Recurring capitalized opex, related-party rev > 10%, restatement risk, going-concern doubt |
| `HIGH`     | >5% of EBITDA at risk; structural revenue quality issue                                    |
| `MEDIUM`   | Investigation required, likely manageable                                                  |
| `LOW`      | Disclosure / housekeeping                                                                  |

## Cross-references

A3 may flag concentration when A5 found it; emit anyway and tag:

```json
{ "cross_ref": { "agent": "A5", "purpose": "concentration overlap" } }
```

## Normalizer behaviour

```
For each finding f in output.findings:
  1. UPSERT each evidence[i] into Citation (allocate cN displayId)
     primaryCitationId = ID of evidence[primary_evidence_index]
  2. INSERT Finding with displayId = next "rfN" for this dealId
       category = "FINANCIAL"
       agentId = "A3"
       raisedBy = "ai"
       suggestedQuestion = f.management_question
  3. INSERT ManagementQuestion with displayId = next "qN", topic = "FINANCIAL",
       derivedFromFindingId = the finding ID just inserted
```

## Feature coverage

- 90% of "Quality of Earnings red flags" automatable.
- Remaining 10% = forensic procedures (bank confirmations, reperformance) — outside VDR scope.
