import { NextResponse } from "next/server";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { inngest } from "@/src/infrastructure/inngest/client";
import { runPipeline } from "@/src/application/orchestration/pipeline";
import { AiGatewayAgentRunner } from "@/src/infrastructure/llm/agents/AiGatewayAgentRunner";
import { GeminiPdfExtractor } from "@/src/infrastructure/extraction/GeminiPdfExtractor";
import { VercelBlobStorage } from "@/src/infrastructure/blob/VercelBlobStorage";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel Pro: 300s; locally Node has no limit.

/**
 * When `RUN_PIPELINE_INLINE=1` we bypass Inngest and run the pipeline as a
 * fire-and-forget background task in the same Node process. Useful for local
 * demos when nobody wants to spin up `inngest-cli dev` alongside `pnpm dev`.
 *
 * NOT recommended for production — durability + retries are lost.
 */
const INLINE_FALLBACK = process.env.RUN_PIPELINE_INLINE === "1";

/**
 * POST /api/deals/:dealId/run
 *
 * Creates a fresh DDRun row for the deal and emits an Inngest event so the
 * pipeline picks it up and runs out-of-process. Returns the new runId so the
 * UI can poll / subscribe to progress.
 *
 * Errors are caught and returned as JSON with a message — silent 500s make
 * the dropzone button useless.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> },
): Promise<Response> {
  let dealId = "";
  try {
    ({ dealId } = await params);

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return NextResponse.json({ error: "deal_not_found", dealId }, { status: 404 });
    }

    const docCount = await prisma.document.count({ where: { dealId } });
    if (docCount === 0) {
      return NextResponse.json(
        {
          error: "no_documents",
          message: "Upload at least one document before running the pipeline.",
        },
        { status: 400 },
      );
    }

    // Reap zombie runs from a previous crash (Node killed mid-pipeline). They
    // would otherwise lock the deal forever as "RUNNING".
    const zombieCutoff = new Date(Date.now() - 30 * 60_000);
    await prisma.dDRun.updateMany({
      where: {
        dealId,
        status: { in: ["QUEUED", "RUNNING"] },
        OR: [
          { startedAt: null, createdAt: { lt: zombieCutoff } },
          { startedAt: { lt: zombieCutoff } },
        ],
      },
      data: { status: "FAILED", completedAt: new Date() },
    });

    // Reset stuck EXTRACTING (zombie) docs back to UPLOADED so Phase 0 picks
    // them up. FAILED docs are already retried by Phase 0 itself.
    await prisma.document.updateMany({
      where: { dealId, status: "EXTRACTING" },
      data: { status: "UPLOADED" },
    });

    const run = await prisma.dDRun.create({
      data: { dealId, status: "QUEUED" },
      select: { id: true },
    });

    const asOfDate = new Date().toISOString().slice(0, 10);

    if (INLINE_FALLBACK) {
      // Fire-and-forget: the pipeline writes its own progress to the DB; the
      // dashboard polls those rows. We do NOT await — the HTTP response
      // returns immediately with the runId.
      void runInlinePipeline(run.id, dealId, asOfDate);
      return NextResponse.json({
        runId: run.id,
        status: "QUEUED",
        mode: "inline",
      });
    }

    try {
      await inngest.send({
        name: "athena/pipeline.start",
        data: { runId: run.id, dealId, asOfDate },
      });
    } catch (sendErr) {
      // Roll back the DDRun row so the user can retry cleanly.
      await prisma.dDRun
        .update({
          where: { id: run.id },
          data: { status: "FAILED", errorJson: serialize(sendErr) },
        })
        .catch(() => undefined);
      console.error("[pipeline.start] inngest.send failed:", sendErr);
      return NextResponse.json(
        {
          error: "inngest_send_failed",
          message:
            "Could not enqueue the pipeline. In dev: run `npx inngest-cli@latest dev` in a second terminal, OR set RUN_PIPELINE_INLINE=1 in .env to bypass Inngest. In prod: check INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY.",
          detail: serialize(sendErr),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ runId: run.id, status: "QUEUED", mode: "inngest" });
  } catch (err) {
    console.error(`[pipeline.start] route failed for deal=${dealId}:`, err);
    return NextResponse.json(
      {
        error: "pipeline_start_failed",
        message: err instanceof Error ? err.message : String(err),
        detail: serialize(err),
      },
      { status: 500 },
    );
  }
}

function serialize(err: unknown): object {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack?.split("\n").slice(0, 5) };
  }
  return { error: String(err) };
}

/**
 * Run the full pipeline in-process. Errors are caught and persisted onto the
 * DDRun row so the dashboard can render them. The HTTP request that
 * triggered this is long-since gone.
 */
async function runInlinePipeline(runId: string, dealId: string, asOfDate: string): Promise<void> {
  try {
    const agentRunner = new AiGatewayAgentRunner();
    const pdfExtractor = new GeminiPdfExtractor();
    const blobStorage = new VercelBlobStorage();
    await runPipeline(
      { prisma, agentRunner, pdfExtractor, blobStorage },
      { runId, dealId, asOfDate },
    );
  } catch (err) {
    console.error(`[pipeline.inline] run ${runId} failed:`, err);
    await prisma.dDRun
      .update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorJson: serialize(err),
        },
      })
      .catch(() => undefined);
  }
}
