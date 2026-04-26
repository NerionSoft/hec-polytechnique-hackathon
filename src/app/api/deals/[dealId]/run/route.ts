import { NextResponse } from "next/server";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { inngest } from "@/src/infrastructure/inngest/client";

/**
 * POST /api/deals/:dealId/run
 *
 * Creates a fresh DDRun row for the deal and emits an Inngest event so the
 * pipeline picks it up and runs out-of-process. Returns the new runId so the
 * UI can poll / subscribe to progress.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> },
): Promise<Response> {
  const { dealId } = await params;

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) {
    return NextResponse.json({ error: "deal_not_found" }, { status: 404 });
  }

  const run = await prisma.dDRun.create({
    data: { dealId, status: "QUEUED" },
    select: { id: true },
  });

  await inngest.send({
    name: "athena/pipeline.start",
    data: {
      runId: run.id,
      dealId,
      asOfDate: new Date().toISOString().slice(0, 10),
    },
  });

  return NextResponse.json({ runId: run.id, status: "QUEUED" });
}
