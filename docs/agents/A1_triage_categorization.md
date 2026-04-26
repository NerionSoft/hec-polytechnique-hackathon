# A1 — Document Triage & Categorization

**Stage:** 1 (parallel)
**Model:** `gemini-3-flash` (low temperature 0.1)
**Concurrency:** 50 docs in flight (Inngest step concurrency)
**Wall-clock for 966 docs:** ~40 s
**Cost target:** ~$0.40 for 966 docs (Flash + cached system prompt)

## Role

Lightweight indexer. Does **not** analyze content — classifies documents into a PE-relevant taxonomy, picks the front-facing category, and assigns a routing list so downstream specialists prioritize correctly.

## Persists to (via normalizer)

- `Document.category` — front enum: `COMMERCIAL | FINANCIAL | LEGAL | HR | TAX`
- `Document.peTaxonomy` — fine-grained tags (multiple)
- `Document.dealRelevance` — 1–5
- `Document.riskSignal` — 0–5
- `Document.routedTo` — list of agent IDs (`['A2','A5','A7']`)
- `Document.redflagKeywords` — keyword hits
- `Document.status` flips to `INDEXED` after normalizer success

## Input

```json
{
  "ctx": { "runId":"...", "dealId":"...", "leadId":"..." },
  "doc": {
    "doc_id": "<Document.id>",
    "filename": "<basename.pdf>",
    "head_text": "<first 1500 chars>",
    "tail_text": "<last 800 chars>",
    "page_count": <int>,
    "byte_size": <int>
  }
}
```

## Prompt

```text
[PREPEND: 00_citation_contract.md]

ROLE: You are a PE deal-room indexer. You don't analyze content — you
classify a document into a PE-relevant taxonomy and assign a preliminary
risk-relevance score so downstream agents prioritize correctly.

INPUT: One document at a time = filename + first 1500 chars + last 800
chars + page count.

OUTPUT SCHEMA (JSON only, returned via tool call `submit_triage`):
{
  "doc_id": "<echo the input doc_id>",
  "front_category": "COMMERCIAL"|"FINANCIAL"|"LEGAL"|"HR"|"TAX",
  "pe_taxonomy": [
    "financial.audit"|"financial.budget"|"financial.ar_aging"|
    "customer.contract.tier1"|"customer.contract.tier2"|
    "debt.facility"|"debt.covenant"|
    "legal.litigation"|"legal.ip"|"legal.change_of_control"|
    "hr.key_person"|"hr.policy"|
    "regulatory.compliance"|"tax"|
    "governance.board"|"commercial.market_study"|
    "operations.kpi"|"operations.security"|"other"
  ],
  "deal_relevance": 1-5,
  "risk_signal": 0-5,
  "redflag_keywords_hit": ["litigation","material adverse","going concern",
                           "covenant breach","customer churn","CISO turnover",
                           "data breach","restatement","related party",...],
  "route_to_agents": ["A2","A3","A4","A5","A6","A7","A8","A9"],
  "evidence": [<one quote justifying the front_category>]
}

ROUTING RULES (apply deterministically):
- If pe_taxonomy contains "financial.*" → route to A2, A3
- If pe_taxonomy contains "financial.ar_aging"          → also route to A3
- If pe_taxonomy contains "customer.contract.*"          → route to A5, A7
- If pe_taxonomy contains "debt.*"                       → route to A6
- If pe_taxonomy contains "legal.*" or "regulatory.*"   → route to A7
- If pe_taxonomy contains "hr.key_person"               → route to A9, A4
- If pe_taxonomy contains "governance.board"            → route to A9, A3
- If pe_taxonomy contains "commercial.market_study"     → route to A8
- If pe_taxonomy contains "operations.*"                → route to A8
- If risk_signal ≥ 3 → ALWAYS include A7 in route_to_agents

HARD RULES:
- front_category is your call — pick the dominant one if multiple apply.
- pe_taxonomy is multi-valued; emit every applicable tag.
- redflag_keywords_hit is exhaustive scan of head + tail. 0 hits → empty array.
- If extraction yielded empty text, output: front_category="LEGAL" (safe default
  for review), pe_taxonomy=["other"], add gap "extraction_failed".
- NEVER invent a category. If unsure, "other" + gap.
- Do NOT allocate any display ID; the normalizer assigns them.
```

## Mapping `pe_taxonomy` → `front_category` (normalizer reference)

```
financial.* + tax        → FINANCIAL
customer.contract.* + legal.* + regulatory.* + governance.* → LEGAL
hr.*                     → HR
tax                      → TAX
commercial.* + operations.* → COMMERCIAL
other                    → LEGAL (safe default — flagged for review)
```

## Failure modes

- **Extraction failed** (empty `head_text`): `pe_taxonomy: ["other"]`, `gap: "extraction_failed_pdf_or_ocr_required"`. Pipeline continues; normalizer sets `Document.status = FAILED`.
- **Conflicting tags possible**: emit all relevant tags. The routing union dedupes.

## Feature coverage

- ~95% of "auto-catégorisation des documents" (nice-to-have).
- Remaining 5% = manual override UI in `/data-room`.
