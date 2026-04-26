import { Prisma } from "@prisma/client";
import { prisma } from "../persistence/prisma/client";
import { AiGatewayAgentRunner } from "../llm/agents/AiGatewayAgentRunner";
import { UnpdfExtractor } from "../extraction/UnpdfExtractor";
import { inngest, type PipelineStartData } from "./client";
import { buildAgentContext } from "@/src/application/orchestration/buildAgentContext";
import { ingestDocuments } from "@/src/application/orchestration/steps/ingestDocuments";
import { runTriageOnDocument } from "@/src/application/orchestration/steps/runTriageOnDocument";
import { retrieveForAgent } from "@/src/application/orchestration/retrieval";
import {
  loadStage1Outputs,
  loadS1Output,
} from "@/src/application/orchestration/steps/loadStage1Outputs";
import { loadMemoContext } from "@/src/application/orchestration/steps/loadMemoContext";
import { loadVerifierInput } from "@/src/application/orchestration/steps/loadVerifierInput";
import { makeRunFinancialAgent } from "@/src/application/agents/financial/RunFinancialAgent";
import { makeRunQoeAgent } from "@/src/application/agents/qoe/RunQoeAgent";
import { makeRunEbitdaAgent } from "@/src/application/agents/ebitda/RunEbitdaAgent";
import { makeRunConcentrationAgent } from "@/src/application/agents/concentration/RunConcentrationAgent";
import { makeRunDebtAgent } from "@/src/application/agents/debt/RunDebtAgent";
import { makeRunLegalAgent } from "@/src/application/agents/legal/RunLegalAgent";
import { makeRunCommercialAgent } from "@/src/application/agents/commercial/RunCommercialAgent";
import { makeRunManagementAgent } from "@/src/application/agents/management/RunManagementAgent";
import { makeRunThesisAgent } from "@/src/application/agents/thesis/RunThesisAgent";
import { makeRunMemoAgent } from "@/src/application/agents/memo/RunMemoAgent";
import { makeRunVerifierAgent } from "@/src/application/agents/verifier/RunVerifierAgent";

const MAX_VERIFIER_LOOPS = 3;

const agentRunner = new AiGatewayAgentRunner();
const pdfExtractor = new UnpdfExtractor();
const deps = { prisma, agentRunner, pdfExtractor, fetch };

/**
 * Durable Inngest function that drives the Athena pipeline end-to-end.
 *
 * Each `step.run` is checkpointed: if any step throws, Inngest retries it
 * without re-running the previous ones — durable execution by construction.
 * Stage-1 specialists fan out via `Promise.all` of step.run calls so their
 * 8 LLM calls genuinely run in parallel.
 */
export const pipelineFn = inngest.createFunction(
  {
    id: "athena-pipeline",
    concurrency: [{ scope: "fn", limit: 5 }],
    retries: 2,
    triggers: [{ event: "athena/pipeline.start" }],
  },
  async ({
    event,
    step,
  }: {
    event: { name: string; data: PipelineStartData };
    step: {
      run: <T>(id: string, fn: () => Promise<T> | T) => Promise<T>;
    };
  }) => {
    const { runId, dealId, asOfDate } = event.data;

    const ctx = await step.run("build-ctx", () =>
      buildAgentContext({ prisma }, { runId, asOfDate }),
    );

    await step.run("phase0.start", async () => {
      await prisma.dDRun.update({
        where: { id: runId },
        data: { status: "RUNNING", startedAt: new Date(), phase: "phase0_ingest" },
      });
      await prisma.dealAuditEvent.create({
        data: { dealId, kind: "pipeline_started" },
      });
    });

    const ingest = await step.run("phase0.ingest", () => ingestDocuments(deps, { dealId }));
    await step.run("phase0.audit", () =>
      prisma.dealAuditEvent.create({
        data: {
          dealId,
          kind: "phase0_completed",
          payload: ingest as unknown as Prisma.InputJsonValue,
        },
      }),
    );

    // ── Phase 1a : A1 fan-out (capped concurrency) ──────────────────────
    await step.run("phase1.triage.begin", () =>
      prisma.dDRun.update({
        where: { id: runId },
        data: { phase: "phase1_triage" },
      }),
    );
    const indexedDocs: { id: string }[] = await step.run("phase1.list-indexed-docs", () =>
      prisma.document.findMany({
        where: { dealId, status: "INDEXED" },
        select: { id: true },
      }),
    );
    await Promise.all(
      indexedDocs.map((d) =>
        step.run(`A1.${d.id}`, () => runTriageOnDocument(deps, { ctx, documentId: d.id })),
      ),
    );

    // ── Phase 1b : 8 specialists in parallel ────────────────────────────
    await step.run("phase1.specialists.begin", () =>
      prisma.dDRun.update({
        where: { id: runId },
        data: { phase: "phase1_specialists" },
      }),
    );

    const a2 = makeRunFinancialAgent(deps);
    const a3 = makeRunQoeAgent(deps);
    const a4 = makeRunEbitdaAgent(deps);
    const a5 = makeRunConcentrationAgent(deps);
    const a6 = makeRunDebtAgent(deps);
    const a7 = makeRunLegalAgent(deps);
    const a8 = makeRunCommercialAgent(deps);
    const a9 = makeRunManagementAgent(deps);

    await Promise.all([
      step.run("A2", async () =>
        swallow("A2", a2({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A2", dealId }) })),
      ),
      step.run("A3", async () =>
        swallow("A3", a3({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A3", dealId }) })),
      ),
      step.run("A4", async () =>
        swallow("A4", a4({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A4", dealId }) })),
      ),
      step.run("A5", async () =>
        swallow("A5", a5({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A5", dealId }) })),
      ),
      step.run("A6", async () =>
        swallow("A6", a6({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A6", dealId }) })),
      ),
      step.run("A7", async () =>
        swallow("A7", a7({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A7", dealId }) })),
      ),
      step.run("A8", async () =>
        swallow("A8", a8({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A8", dealId }) })),
      ),
      step.run("A9", async () =>
        swallow("A9", a9({ ctx, chunks: await retrieveForAgent(deps, { agentId: "A9", dealId }) })),
      ),
    ]);

    // ── Phase 2 : S1 + S2 ──────────────────────────────────────────────
    const stage1 = await step.run("phase2.load-stage1", () => loadStage1Outputs(deps, runId));
    const s1 = makeRunThesisAgent(deps);
    await step.run("S1", () => s1({ ctx, input: stage1 }));

    const memoCtx = await step.run("phase2.load-memo-ctx", () => loadMemoContext(deps, dealId));
    const s1_output = await step.run("phase2.load-s1-output", () => loadS1Output(deps, runId));

    const s2 = makeRunMemoAgent(deps);
    await step.run("S2", () =>
      s2({
        ctx,
        input: {
          s1_output,
          ...stage1,
          existing_findings: memoCtx.findings,
          existing_citations: memoCtx.citations,
        },
      }),
    );

    // ── Phase 3 : S3 verifier loop ─────────────────────────────────────
    const s3 = makeRunVerifierAgent(deps);
    for (let i = 0; i < MAX_VERIFIER_LOOPS; i++) {
      const input = await step.run(`S3.${i}.load-input`, () => loadVerifierInput(deps, dealId));
      const verdict = await step.run(`S3.${i}`, () => s3({ ctx, input, iteration: i }));
      if (verdict.output.verdict === "pass" || !verdict.shouldRedraft) break;

      const fresh = await step.run(`S2.redraft.${i}.load-ctx`, () => loadMemoContext(deps, dealId));
      await step.run(`S2.redraft.${i}`, () =>
        s2({
          ctx,
          input: {
            s1_output,
            ...stage1,
            existing_findings: fresh.findings,
            existing_citations: fresh.citations,
            fixes: verdict.output.failures.map(
              (f: {
                section_key: string;
                memo_excerpt: string;
                issue: string;
                suggested_fix?: string | null;
              }) => ({
                section_key: f.section_key,
                memo_excerpt: f.memo_excerpt,
                issue: f.issue,
                suggested_fix: f.suggested_fix ?? null,
              }),
            ),
          },
        }),
      );
    }

    // ── Phase 4 : finalize ─────────────────────────────────────────────
    await step.run("phase4.finalize", async () => {
      const final = await prisma.dDRun.findUnique({
        where: { id: runId },
        select: { status: true },
      });
      if (final?.status !== "NEEDS_REVIEW") {
        await prisma.dDRun.update({
          where: { id: runId },
          data: { status: "COMPLETED", completedAt: new Date(), phase: "completed" },
        });
        await prisma.deal.update({
          where: { id: dealId },
          data: { stage: "IC_READY" },
        });
      }
      await prisma.dealAuditEvent.create({
        data: {
          dealId,
          kind: "pipeline_completed",
          payload: { runId } as Prisma.InputJsonValue,
        },
      });
    });
  },
);

async function swallow<T>(label: string, p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    console.error(`[pipeline] ${label} failed:`, (err as Error).message);
    return null;
  }
}
