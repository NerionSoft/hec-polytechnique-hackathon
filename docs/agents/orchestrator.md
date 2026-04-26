# Orchestrator

**Role:** Coordinates all 12 agents end-to-end + their normalizers. Not an analytical agent — a workflow controller running on Inngest.
**Model:** None (deterministic state machine).
**LLM SDK used by agents:** `@google/genai` (Gemini 3). `GOOGLE_API_KEY` must be in `.env`.

## Inngest function shape

```ts
// src/application/orchestration/pipeline.fn.ts
export const pipelineFn = inngest.createFunction(
  {
    id: "athena-pipeline",
    concurrency: [{ scope: "fn", limit: 5 }], // 5 deals in flight max
    retries: 3,
  },
  { event: "deal/pipeline.start" },
  async ({ event, step }) => {
    const { runId, dealId, leadId, ownerId } = event.data;
    const ctx: AgentContext = await step.run("build-ctx", () =>
      buildAgentContext({ runId, dealId, leadId, ownerId }),
    );

    // ───────── Phase 0 : ingest ─────────
    const docs = await step.run("phase0.list-docs", () =>
      prisma.document.findMany({ where: { dealId } }),
    );
    await Promise.all(
      chunk(docs, 10).map((batch, i) =>
        step.run(`phase0.extract.batch-${i}`, () => extractAndChunk(batch)),
      ),
    );

    // ───────── Phase 1a : A1 triage (50 concurrent) ─────────
    await Promise.all(
      docs.map((doc) =>
        step.run(`A1.${doc.id}`, { concurrency: { limit: 50, key: "A1" } }, async () => {
          const out = await runAgent("A1", ctx, { doc });
          await normalizeA1(prisma, ctx, out);
        }),
      ),
    );

    // ───────── Phase 1b : Specialists in parallel ─────────
    await Promise.all([
      step.run("A2", () => runAndNormalize("A2", ctx, normalizeA2)),
      step.run("A3", () =>
        runAndNormalize("A3", ctx, (p, c, o) =>
          normalizeFindings(
            p,
            c,
            { agentId: "A3", defaultCategory: "FINANCIAL", topicFor: () => "FINANCIAL" },
            o.findings,
          ),
        ),
      ),
      step.run("A4", () => runAndNormalize("A4", ctx, normalizeA4)),
      step.run("A5", () => runAndNormalize("A5", ctx, normalizeA5)),
      step.run("A6", () =>
        runAndNormalize("A6", ctx, (p, c, o) =>
          normalizeFindings(
            p,
            c,
            { agentId: "A6", defaultCategory: "FINANCIAL", topicFor: () => "FINANCIAL" },
            o.redflag_findings,
          ),
        ),
      ),
      step.run("A7", () =>
        runAndNormalize("A7", ctx, (p, c, o) =>
          normalizeFindings(
            p,
            c,
            { agentId: "A7", defaultCategory: "LEGAL", topicFor: () => "LEGAL" },
            o.findings,
          ),
        ),
      ),
      step.run("A8", () => runAndNormalize("A8", ctx, normalizeA8)),
      step.run("A9", () =>
        runAndNormalize("A9", ctx, (p, c, o) =>
          normalizeFindings(
            p,
            c,
            {
              agentId: "A9",
              topicFor: (f) => (f.category === "OPERATIONAL" ? "OPERATIONAL" : "ESG"),
            },
            o.redflag_findings,
          ),
        ),
      ),
    ]);

    // Update Deal.redFlagsCount cache
    await step.run("phase1.refresh-counts", () => refreshDealAggregates(dealId));

    // ───────── Phase 2 : synthesis ─────────
    await step.run("S1", () => runAndNormalize("S1", ctx, normalizeS1));
    await step.run("S2", () => runAndNormalize("S2", ctx, normalizeS2));

    // ───────── Phase 3 : verifier loop ─────────
    for (let i = 0; i < 3; i++) {
      const verdict = await step.run(`S3.${i}`, () => runAgent("S3", ctx, { iteration: i }));
      await step.run(`S3.${i}.normalize`, () => normalizeS3(prisma, ctx, verdict, i));
      if (verdict.verdict === "pass") break;
      if (i === 2) {
        await prisma.dDRun.update({
          where: { id: ctx.runId },
          data: { status: "NEEDS_REVIEW", completedAt: new Date() },
        });
        return;
      }
      await step.run(`S2.redraft.${i}`, () =>
        runAndNormalize("S2", ctx, normalizeS2, { fixes: verdict.failures }),
      );
    }

    // ───────── Phase 4 : finalize ─────────
    await step.run("phase4.finalize", async () => {
      await prisma.dDRun.update({
        where: { id: ctx.runId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      await prisma.deal.update({
        where: { id: ctx.dealId },
        data: { stage: "IC_READY" },
      });
      await prisma.dealAuditEvent.create({
        data: { dealId, kind: "pipeline_completed" },
      });
    });
  },
);

// Helper: run agent + persist raw output + run normalizer in one step
async function runAndNormalize<T>(
  agentId: AgentId,
  ctx: AgentContext,
  normalizer: (p: PrismaClient, c: AgentContext, o: T, ...rest: any[]) => Promise<void>,
  extra?: any,
) {
  const out = await runAgent(agentId, ctx, extra);
  // Already persisted to AgentOutput.output by runAgent itself
  await normalizer(prisma, ctx, out as any);
  return out;
}
```

## State machine

```
DDRun.status     Memo.status      Trigger
─────────────────────────────────────────────────────────────────
QUEUED           —                pipeline.start event received
RUNNING          —                Phase 0 begins
RUNNING          DRAFT            S2 normalizer creates Memo
RUNNING          REVIEW           S3 verdict=pass
COMPLETED        REVIEW           Phase 4 finalize
NEEDS_REVIEW     NEEDS_REVIEW     S3 fails after 3 loops
FAILED           —                unrecoverable error in any step
```

## Concurrency budget

| Phase                 | Parallelism                  | Bottleneck                  |
| --------------------- | ---------------------------- | --------------------------- |
| Phase 0 PDF extract   | thread pool (CPU)            | local I/O                   |
| Phase 0 chunk + embed | embeddings batch             | embeddings RPM              |
| Phase 1 A1            | 50 concurrent LLM calls      | provider RPM/TPM            |
| Phase 1 A2..A9        | 8 concurrent (one per agent) | provider TPM (Opus heavier) |
| Phase 2 S1 → S2       | sequential                   | —                           |
| Phase 3 S3 → loop     | sequential                   | —                           |

## Inputs to every agent (deal context)

```ts
type AgentContext = {
  runId: string;
  dealId: string;
  leadId: string;
  ownerId: string;
  thesisId: string | null;
  industry: string | null;
  geographies: string[];
  fiscalYearEnd: string;
  asOfDate: string;
  currency: "EUR" | "USD";
};
```

This context is passed unchanged to every agent. Agents read what they need.

## Failure handling

| Failure                           | Action                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| A1 fails on a single doc          | Mark doc `Document.status = FAILED`, continue pipeline                                   |
| A1 fails on > 5% of docs          | Halt run, surface to user — likely OCR config issue                                      |
| A2..A9 single agent crash         | Retry once; on second failure, mark `AgentOutput.status = failed`, store error, continue |
| S1 fails                          | Halt — no memo without thesis                                                            |
| S2 fails (zod parse)              | Retry once with stricter prompt; on second failure → `NEEDS_REVIEW`                      |
| S3 verdict = `fail` after 3 loops | `NEEDS_REVIEW`, dashboard shows red-highlighted claims                                   |

## DealAuditEvent emissions

The orchestrator emits at key transitions for the `/audit` page:

```
kind                       payload
─────────────────────────────────────────────────────────
"pipeline_started"         { runId }
"agent_completed"          { agentId, durationMs, costCents }
"agent_failed"             { agentId, error }
"thesis_generated"         <S1 output>
"memo_drafted"             { memoId, sections: 5 }
"citation_verifier_run"    { iteration, passRate, failures }
"memo_published"           { memoId, status }
"finding_approved"         { findingId, approverId }    // user action
"pipeline_completed"       { totalDurationS, totalCostCents }
"pipeline_failed"          { error }
```

## Observability schema

Per-run telemetry surfaced in the deal cockpit:

```json
{
  "runId": "...",
  "dealId": "...",
  "leadId": "...",
  "startedAt": "...",
  "completedAt": "...",
  "phases": {
    "ingestion": { "docs": 966, "extraction_failed": 3, "duration_s": 31 },
    "triage": { "duration_s": 42, "tokens": 2_100_000, "cost_usd": 0.48 },
    "analysis": { "duration_s": 280, "tokens": 18_000_000, "cost_usd": 14.2 },
    "synthesis": { "duration_s": 95, "tokens": 800_000, "cost_usd": 6.4 },
    "verification": { "loops": 1, "duration_s": 75, "citation_pass_rate": 0.997 }
  },
  "totals": { "duration_s": 523, "cost_usd": 21.1, "citations": 187 }
}
```

Computed live from `AgentOutput.tokensIn / tokensOut / costCents / durationMs` aggregated by phase.
