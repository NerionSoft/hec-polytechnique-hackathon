# Athena — Multi-Agent Architecture

Production-grade prompt suite for the AI Due Diligence Copilot.

The pipeline ingests a Lead's data room (after `Lead.status = DATA_ROOM_OPENED`),
runs 12 specialized agents in parallel, and persists everything to Postgres
under a single `Deal` (1:1 with Lead). Every output is sourced and verified.

## Pipeline overview

```
Étage 0 — Pipeline déterministe (pas LLM)
  └─ Ingest PDFs from Vercel Blob → Sectionizer (§n.m) → Chunker
     → pgvector embeddings + tsvector BM25
     → persists Document[], Chunk[]

Étage 1 — Specialist analysts (parallel, single-responsibility)
  ├─ A1. Triage & Categorization      → Document.category + routing
  ├─ A2. Financial Snapshot            → Deal KPIs + FinancialSnapshot.trend
  ├─ A3. Quality of Earnings (QoE)     → Finding[] (FINANCIAL)
  ├─ A4. EBITDA Bridge                 → FinancialSnapshot.bridge
  ├─ A5. Customer Concentration        → FinancialSnapshot.concentration / retention
  ├─ A6. Debt & Covenants              → Finding[] (FINANCIAL)
  ├─ A7. Legal Red Flags               → Finding[] (LEGAL)
  ├─ A8. Commercial DD                 → ManagementQuestion[] (COMMERCIAL)
  └─ A9. Management & Governance       → Finding[] (OPERATIONAL/ESG)

Étage 2 — Synthesis
  ├─ S1. Deal Thesis Synthesizer       → Deal.thesisFit + thesis pillars
  ├─ S2. IC Memo Drafter               → Memo + 5×MemoSection (with [c1] [rf1] tags)
  └─ S3. Citation Verifier (Grounder)  → flips Citation.verified, gate blocking
```

## Persistence model

Every agent emits a JSON output → stored verbatim in `AgentOutput.output`
(audit & replay) → run through a per-agent **normalizer** (deterministic TS,
no LLM) that writes to typed Prisma tables consumed by the dashboard:

```
LLM JSON output
   │
   ▼
AgentOutput.output (Json) ◄── audit/replay source of truth
   │
   ▼ normalizer
   ▼
┌──────────────┬──────────────┬──────────────┬──────────────┐
Finding[]      Citation[]     ManagementQ.   FinancialSnap.
   │
   ▼ S2 normalizer
Memo + MemoSection[5] (markdown with [c1]/[rf1] inline tags)
```

All artifacts hang off `Deal` (FK), so `Lead` (the entreprise) is always
reachable via `Deal.lead`.

## Files

| File                                                           | Agent                      | Stage | Model                     | Persists to                                             |
| -------------------------------------------------------------- | -------------------------- | ----- | ------------------------- | ------------------------------------------------------- |
| [`00_citation_contract.md`](00_citation_contract.md)           | Shared contract            | All   | —                         | —                                                       |
| [`run_agent.md`](run_agent.md)                                 | Generic Gemini runner spec | All   | —                         | —                                                       |
| [`A1_triage_categorization.md`](A1_triage_categorization.md)   | Document triage            | 1     | `gemini-3-flash`          | `Document.category`, `peTaxonomy`, `routedTo`           |
| [`A2_financial_snapshot.md`](A2_financial_snapshot.md)         | Financial snapshot         | 1     | `gemini-3-flash`          | `Deal` KPIs + `FinancialSnapshot` views                 |
| [`A3_quality_of_earnings.md`](A3_quality_of_earnings.md)       | QoE red flags              | 1     | `gemini-3-pro` (thinking) | `Finding[]` (FINANCIAL) + `Citation[]`                  |
| [`A4_ebitda_bridge.md`](A4_ebitda_bridge.md)                   | EBITDA adjustments         | 1     | `gemini-3-flash`          | `FinancialSnapshot.bridgeJson`                          |
| [`A5_customer_concentration.md`](A5_customer_concentration.md) | Customer concentration     | 1     | `gemini-3-flash`          | `FinancialSnapshot.concentrationJson` + `retentionJson` |
| [`A6_debt_covenants.md`](A6_debt_covenants.md)                 | Debt & covenants           | 1     | `gemini-3-flash`          | `Finding[]` (FINANCIAL)                                 |
| [`A7_legal_red_flags.md`](A7_legal_red_flags.md)               | Legal red flags            | 1     | `gemini-3-pro` (thinking) | `Finding[]` (LEGAL)                                     |
| [`A8_commercial_dd.md`](A8_commercial_dd.md)                   | Commercial DD              | 1     | `gemini-3-flash`          | `ManagementQuestion[]` (COMMERCIAL)                     |
| [`A9_management_governance.md`](A9_management_governance.md)   | Management & governance    | 1     | `gemini-3-flash`          | `Finding[]` (OPERATIONAL)                               |
| [`S1_deal_thesis.md`](S1_deal_thesis.md)                       | Deal thesis                | 2     | `gemini-3-pro` (thinking) | `Deal.thesisFit`                                        |
| [`S2_ic_memo_drafter.md`](S2_ic_memo_drafter.md)               | IC memo                    | 2     | `gemini-3-pro` (thinking) | `Memo` + 5×`MemoSection` + final `Citation[]`           |
| [`S3_citation_verifier.md`](S3_citation_verifier.md)           | Citation verifier          | 2     | `gemini-3-flash`          | flips `Citation.verified`                               |
| [`normalizers.md`](normalizers.md)                             | Agent → table mapping spec | —     | —                         | —                                                       |
| [`orchestrator.md`](orchestrator.md)                           | Workflow controller        | —     | —                         | —                                                       |
| [`coverage_map.md`](coverage_map.md)                           | Demo coverage table        | —     | —                         | —                                                       |

## Common context (passed to every agent)

```ts
type AgentContext = {
  runId: string; // DDRun.id
  dealId: string; // Deal.id (parent of all artifacts)
  leadId: string; // Lead.id (the entreprise — for traceability)
  ownerId: string; // who triggered this run
  thesisId: string | null;
  industry: string | null;
  geographies: string[];
  fiscalYearEnd: string;
  asOfDate: string;
  currency: "EUR" | "USD";
};
```

Agents emit JSON only. Normalizers attach `dealId` / `runId` to every row
on insert. Citation/Finding/Question display IDs (`c1`, `rf1`, `q1`) are
allocated by the normalizer, not by the agent (avoids collisions across
parallel agents).

## LLM stack

- **SDK** : [`@google/genai`](https://www.npmjs.com/package/@google/genai) (v1+)
- **Auth** : `process.env.GOOGLE_API_KEY` (Gemini API key)
- **Models** :
  - `gemini-3-pro` (or `gemini-3-pro-thinking`) — heavy reasoning agents (A3/A7/S1/S2)
  - `gemini-3-flash` — high-throughput / structured-extraction agents (A1/A2/A4/A5/A6/A8/A9/S3)
- **Structured output** : `responseMimeType: "application/json"` + `responseSchema` (zero JSON parsing failures, schema enforced server-side).
- **Context caching** : explicit Gemini Caches API for the citation contract + per-agent system prompt (used across the 966 A1 invocations and the 8 stage-1 agents).

## Wall-clock target

- Phase 0 (PDF extraction + chunk + embed): ~50 s
- Phase 1 (A1 fan-out, 50 concurrents on Flash): ~40 s
- Phase 1 (A2..A9 in parallel): ~3–5 min (bounded by A3/A7 Pro thinking)
- Phase 2 (S1 → S2 → S3 with up to 3 verifier loops): ~2 min
- **Total: ~10–12 min for a 966-doc VDR**

vs. 5–10 days for a human analyst → ~95% time saved.

## Anti-hallucination guarantees

1. Every agent inherits [`00_citation_contract.md`](00_citation_contract.md).
2. Every claim must carry `evidence[]` with verbatim quotes + chunk IDs.
3. Outputs are **JSON-schema-enforced** by Gemini (`responseSchema`) — no malformed JSON ever reaches the normalizer.
4. S3 is a blocking gate: no memo ships without 100% citation verification.
5. Failure mode: `null` + `gap` entry, never fabricate.
