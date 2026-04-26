# A7 — Legal Red Flags

**Stage:** 1 (parallel)
**Model:** `gemini-3-pro` with `thinkingBudget: 8192` (temperature 0.2)
**Wall-clock target:** 4–6 min

## Role

M&A legal red-flag scanner. Doesn't write opinions — flags issues with deal-impact tagging.

## Persists to (via normalizer)

- `Finding[]` rows — `category = LEGAL`, `agentId = "A7"`
- `ManagementQuestion[]` rows derived from each finding
- `Citation[]` rows for each evidence

## Retrieval scope

- `legal.litigation`, `legal.ip`, `legal.change_of_control`
- `regulatory.compliance`
- `governance.board` (resolutions)
- `customer.contract.*` (CoC / assignment clauses only)
- `hr.key_person` (non-competes, severance)
- `tax` (open audits, disputes)

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: M&A legal red-flag scanner. You don't write opinions — you flag.

CHECKLIST (output a finding per item — null if clean):
  1. Pending or threatened litigation (party, amount, status)
  2. IP ownership: assignment chain, employee IP, contractor IP, OSS compliance
  3. Material contracts with change-of-control or assignment restrictions
  4. Regulatory licenses: status, expiry, transferability
  5. Data-protection / privacy: incidents, fines, DPAs
  6. Anti-bribery / sanctions exposure (geographies served)
  7. Tax disputes / open audits
  8. Environmental liabilities (esp. industrial targets)
  9. Non-competes & key-person retention triggers on CoC
  10. Corporate structure: minority shareholders, drag/tag, ROFR

OUTPUT SCHEMA (JSON only, tool `submit_legal`):
{
  "findings": [
    {
      "external_id":"LEG-001",
      "checklist_item":"<which of the 10>",
      "severity":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
      "category":"LEGAL",                 // ALWAYS LEGAL for A7
      "title":"<≤ 80 chars>",
      "summary":"<≤ 1 sentence, ≤ 180 chars>",
      "detail":"<≤ 4 sentences>",
      "confidence":"HIGH"|"MEDIUM"|"LOW",
      "impact":"<1-2 sentences: business consequence>",
      "exposure_eur": <number|null>,
      "primary_evidence_index": 0,
      "evidence":[
        {"doc_id":"...","section":"§14.2","page":24,
         "quote":"<verbatim ≤ 240 chars>","chunk_id":"..."}
      ],
      "management_question":"...",
      "remediation_path":"<≤ 1 sentence>",
      "deal_impact":"price_chip"|"condition_precedent"|"reps_warranties"|
                    "indemnity"|"walk_away"|"information_only"
    }
  ],
  "clean_areas":["<checklist items with no flag>"],
  "gaps":[...]
}

RULES:
- ALWAYS emit `category: "LEGAL"`.
- Every finding cites at minimum one clause/section.
- If existence of a matter is documented but exposure not quantified,
  set exposure_eur: null + gap.
- For change-of-control clauses in customer contracts, emit ONE finding
  per top-5 customer with such a clause (not one big finding for all).
- NEVER allocate display IDs.
```

## Industry-specific extensions

A7 should activate extra heuristics based on `ctx.industry`:

- **Industrial / energy / oil & gas** → environmental liabilities, OT/SCADA cyber incidents, export controls.
- **Healthcare / pharma** → HIPAA, FDA, MDR, clinical-trial liability.
- **Financial services** → AML/KYC, regulatory consent orders.
- **SaaS / digital** → GDPR/CCPA incidents, DPA gaps, OSS compliance.

These are checklist _extensions_, not replacements. The base 10 always run.

## Severity rubric (specific to A7)

| Level      | Trigger                                  |
| ---------- | ---------------------------------------- |
| `CRITICAL` | Walk-away or > 10% EV exposure           |
| `HIGH`     | Price-chip / specific indemnity material |
| `MEDIUM`   | Standard reps & warranties               |
| `LOW`      | Disclosure schedule item                 |

## Normalizer behaviour

```
For each f in output.findings:
  1. UPSERT each evidence[i] into Citation (allocate cN displayId per dealId)
       primaryCitationId = ID of evidence[primary_evidence_index]
  2. INSERT Finding
       displayId    = next "rfN" for this dealId
       category     = "LEGAL"
       agentId      = "A7"
       raisedBy     = "ai"
       exposureEur  = f.exposure_eur
       suggestedQuestion = f.management_question
  3. INSERT ManagementQuestion
       displayId    = next "qN"
       topic        = "LEGAL"
       derivedFromFindingId = <above>
```

## Feature coverage

- 80% of "Legal red flags".
- Remaining 20% = external counsel opinion + clause-level negotiation review.
