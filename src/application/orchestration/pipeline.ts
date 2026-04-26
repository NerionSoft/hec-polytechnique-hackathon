import type { Prisma, PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../ports/AgentRunner";
import type { BlobStorage } from "../ports/BlobStorage";
import type { PdfExtractor } from "../ports/PdfExtractor";
import { buildAgentContext } from "./buildAgentContext";
import { ingestDocuments } from "./steps/ingestDocuments";
import { runTriageOnDocument } from "./steps/runTriageOnDocument";
import { retrieveForAgent } from "./retrieval";
import { loadStage1Outputs, loadS1Output } from "./steps/loadStage1Outputs";
import { loadMemoContext } from "./steps/loadMemoContext";
import { loadVerifierInput } from "./steps/loadVerifierInput";
import { makeRunFinancialAgent } from "../agents/financial/RunFinancialAgent";
import { makeRunQoeAgent } from "../agents/qoe/RunQoeAgent";
import { makeRunEbitdaAgent } from "../agents/ebitda/RunEbitdaAgent";
import { makeRunConcentrationAgent } from "../agents/concentration/RunConcentrationAgent";
import { makeRunDebtAgent } from "../agents/debt/RunDebtAgent";
import { makeRunLegalAgent } from "../agents/legal/RunLegalAgent";
import { makeRunCommercialAgent } from "../agents/commercial/RunCommercialAgent";
import { makeRunManagementAgent } from "../agents/management/RunManagementAgent";
import { makeRunThesisAgent } from "../agents/thesis/RunThesisAgent";
import { makeRunMemoAgent } from "../agents/memo/RunMemoAgent";
import { makeRunVerifierAgent } from "../agents/verifier/RunVerifierAgent";

const MAX_VERIFIER_LOOPS = 3;

export interface PipelineDeps {
  prisma: PrismaClient;
  agentRunner: AgentRunner;
  pdfExtractor: PdfExtractor;
  blobStorage: BlobStorage;
}

export interface RunPipelineArgs {
  runId: string;
  dealId: string;
  asOfDate: string;
}

/**
 * In-process variant of the full Athena pipeline. The Inngest function
 * wraps these steps as `step.run(...)` for durability, but exposing the
 * same logic as a plain function makes integration tests cheap and gives
 * us a "run locally" entry point.
 */
export async function runPipeline(deps: PipelineDeps, args: RunPipelineArgs): Promise<void> {
  const ctx = await buildAgentContext(deps, {
    runId: args.runId,
    asOfDate: args.asOfDate,
  });

  await deps.prisma.dDRun.update({
    where: { id: args.runId },
    data: { status: "RUNNING", startedAt: new Date(), phase: "phase0_ingest" },
  });
  await deps.prisma.dealAuditEvent.create({
    data: { dealId: args.dealId, kind: "pipeline_started" },
  });

  // ─── Phase 0 : ingest + chunk ────────────────────────────────────────
  const ingest = await ingestDocuments(deps, { dealId: args.dealId });
  await deps.prisma.dealAuditEvent.create({
    data: {
      dealId: args.dealId,
      kind: "phase0_completed",
      payload: ingest as unknown as Prisma.InputJsonValue,
    },
  });

  // ─── Phase 1a : A1 triage fan-out ────────────────────────────────────
  await deps.prisma.dDRun.update({
    where: { id: args.runId },
    data: { phase: "phase1_triage" },
  });
  const indexedDocs = await deps.prisma.document.findMany({
    where: { dealId: args.dealId, status: "INDEXED" },
    select: { id: true },
  });
  // A1 fan-out — parallel + per-doc try/catch so one bad doc doesn't sink
  // the whole pipeline. Emits audit start/end events bracketing the burst.
  await deps.prisma.dealAuditEvent
    .create({
      data: {
        dealId: ctx.dealId,
        kind: "phase1_triage_started",
        entity: "A1",
        payload: { runId: ctx.runId, docCount: indexedDocs.length },
      },
    })
    .catch(() => undefined);

  const a1StartedAt = Date.now();
  const A1_CONCURRENCY = 50;
  let a1Cursor = 0;
  let a1Ok = 0;
  let a1Failed = 0;
  const a1Workers = Array.from(
    { length: Math.min(A1_CONCURRENCY, indexedDocs.length) },
    async () => {
      while (true) {
        const idx = a1Cursor++;
        if (idx >= indexedDocs.length) return;
        const d = indexedDocs[idx];
        try {
          await runTriageOnDocument(deps, { ctx, documentId: d.id });
          a1Ok++;
        } catch (err) {
          a1Failed++;
          console.error(
            `[pipeline] A1 failed on ${d.id}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    },
  );
  await Promise.all(a1Workers);

  await deps.prisma.dealAuditEvent
    .create({
      data: {
        dealId: ctx.dealId,
        kind: "phase1_triage_completed",
        entity: "A1",
        payload: {
          runId: ctx.runId,
          docCount: indexedDocs.length,
          ok: a1Ok,
          failed: a1Failed,
          durationMs: Date.now() - a1StartedAt,
        },
      },
    })
    .catch(() => undefined);

  // ─── Phase 1b : specialists in parallel ──────────────────────────────
  await deps.prisma.dDRun.update({
    where: { id: args.runId },
    data: { phase: "phase1_specialists" },
  });

  const a2Run = makeRunFinancialAgent(deps);
  const a3Run = makeRunQoeAgent(deps);
  const a4Run = makeRunEbitdaAgent(deps);
  const a5Run = makeRunConcentrationAgent(deps);
  const a6Run = makeRunDebtAgent(deps);
  const a7Run = makeRunLegalAgent(deps);
  const a8Run = makeRunCommercialAgent(deps);
  const a9Run = makeRunManagementAgent(deps);

  await Promise.all([
    track(deps, ctx, "A2", async () =>
      a2Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A2", dealId: ctx.dealId }) }),
    ),
    track(deps, ctx, "A3", async () =>
      a3Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A3", dealId: ctx.dealId }) }),
    ),
    track(deps, ctx, "A4", async () =>
      a4Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A4", dealId: ctx.dealId }) }),
    ),
    track(deps, ctx, "A5", async () =>
      a5Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A5", dealId: ctx.dealId }) }),
    ),
    track(deps, ctx, "A6", async () =>
      a6Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A6", dealId: ctx.dealId }) }),
    ),
    track(deps, ctx, "A7", async () =>
      a7Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A7", dealId: ctx.dealId }) }),
    ),
    track(deps, ctx, "A8", async () =>
      a8Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A8", dealId: ctx.dealId }) }),
    ),
    track(deps, ctx, "A9", async () =>
      a9Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A9", dealId: ctx.dealId }) }),
    ),
  ]);

  // ─── Phase 2 : S1 thesis ─────────────────────────────────────────────
  await deps.prisma.dDRun.update({
    where: { id: args.runId },
    data: { phase: "phase2_thesis" },
  });
  const stage1 = await loadStage1Outputs(deps, args.runId);
  const s1Run = makeRunThesisAgent(deps);
  await s1Run({ ctx, input: stage1 });

  // ─── Phase 2 : S2 memo ───────────────────────────────────────────────
  await deps.prisma.dDRun.update({
    where: { id: args.runId },
    data: { phase: "phase2_memo" },
  });
  const memoCtx = await loadMemoContext(deps, args.dealId);
  const s1_output = await loadS1Output(deps, args.runId);
  const s2Run = makeRunMemoAgent(deps);
  await s2Run({
    ctx,
    input: {
      s1_output,
      ...stage1,
      existing_findings: memoCtx.findings,
      existing_citations: memoCtx.citations,
    },
  });

  // ─── Phase 3 : S3 verifier loop ──────────────────────────────────────
  await deps.prisma.dDRun.update({
    where: { id: args.runId },
    data: { phase: "phase3_verify" },
  });
  const s3Run = makeRunVerifierAgent(deps);
  for (let i = 0; i < MAX_VERIFIER_LOOPS; i++) {
    const verifierInput = await loadVerifierInput(deps, args.dealId);
    const { shouldRedraft, output } = await s3Run({
      ctx,
      input: verifierInput,
      iteration: i,
    });
    if (output.verdict === "pass") break;
    if (!shouldRedraft) break; // S3 normalizer flagged NEEDS_REVIEW

    await s2Run({
      ctx,
      input: {
        s1_output,
        ...stage1,
        existing_findings: (await loadMemoContext(deps, args.dealId)).findings,
        existing_citations: (await loadMemoContext(deps, args.dealId)).citations,
        fixes: output.failures.map((f) => ({
          section_key: f.section_key,
          memo_excerpt: f.memo_excerpt,
          issue: f.issue,
          suggested_fix: f.suggested_fix ?? null,
        })),
      },
    });
  }

  // ─── Phase 4 : finalize ──────────────────────────────────────────────
  const finalRun = await deps.prisma.dDRun.findUnique({
    where: { id: args.runId },
    select: { status: true },
  });
  if (finalRun?.status !== "NEEDS_REVIEW") {
    await deps.prisma.dDRun.update({
      where: { id: args.runId },
      data: { status: "COMPLETED", completedAt: new Date(), phase: "completed" },
    });
    await deps.prisma.deal.update({
      where: { id: args.dealId },
      data: { stage: "IC_READY" },
    });
  }
  await deps.prisma.dealAuditEvent.create({
    data: {
      dealId: args.dealId,
      kind: "pipeline_completed",
      payload: { runId: args.runId } as Prisma.InputJsonValue,
    },
  });
}

/**
 * Wraps a stage-1 agent run with audit events so the dashboard's audit page
 * shows live progress: one `agent_started` row, then either `agent_completed`
 * or `agent_failed`. A single failure does NOT abort the parent Promise.all
 * (the run is still recorded with status="failed" by the agent's own use case).
 */
async function track<T>(
  deps: PipelineDeps,
  ctx: AgentContextLike,
  label: string,
  body: () => Promise<T>,
): Promise<T | null> {
  const startedAt = Date.now();
  await deps.prisma.dealAuditEvent
    .create({
      data: {
        dealId: ctx.dealId,
        kind: "agent_started",
        entity: label,
        payload: { runId: ctx.runId },
      },
    })
    .catch(() => undefined);

  try {
    const result = await body();
    await deps.prisma.dealAuditEvent
      .create({
        data: {
          dealId: ctx.dealId,
          kind: "agent_completed",
          entity: label,
          payload: { runId: ctx.runId, durationMs: Date.now() - startedAt },
        },
      })
      .catch(() => undefined);
    return result;
  } catch (err) {
    console.error(`[pipeline] stage-1 ${label} failed:`, (err as Error).message);
    await deps.prisma.dealAuditEvent
      .create({
        data: {
          dealId: ctx.dealId,
          kind: "agent_failed",
          entity: label,
          payload: {
            runId: ctx.runId,
            durationMs: Date.now() - startedAt,
            error: (err as Error).message,
          },
        },
      })
      .catch(() => undefined);
    return null;
  }
}

interface AgentContextLike {
  runId: string;
  dealId: string;
}
