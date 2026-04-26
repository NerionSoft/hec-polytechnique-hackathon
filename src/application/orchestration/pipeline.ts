import type { Prisma, PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../ports/AgentRunner";
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
  fetch: typeof fetch;
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
  for (const d of indexedDocs) {
    await runTriageOnDocument(deps, { ctx, documentId: d.id });
  }

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
    settle(
      "A2",
      a2Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A2", dealId: ctx.dealId }) }),
    ),
    settle(
      "A3",
      a3Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A3", dealId: ctx.dealId }) }),
    ),
    settle(
      "A4",
      a4Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A4", dealId: ctx.dealId }) }),
    ),
    settle(
      "A5",
      a5Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A5", dealId: ctx.dealId }) }),
    ),
    settle(
      "A6",
      a6Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A6", dealId: ctx.dealId }) }),
    ),
    settle(
      "A7",
      a7Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A7", dealId: ctx.dealId }) }),
    ),
    settle(
      "A8",
      a8Run({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A8", dealId: ctx.dealId }) }),
    ),
    settle(
      "A9",
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
 * Wraps a stage-1 agent run so a single failure doesn't abort the whole
 * Promise.all (the run is still recorded with status="failed" by the
 * agent's own use case — we just need to swallow the throw here).
 */
async function settle<T>(label: string, p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    console.error(`[pipeline] stage-1 ${label} failed:`, (err as Error).message);
    return null;
  }
}
