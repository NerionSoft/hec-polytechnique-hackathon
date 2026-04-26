import type { Prisma, PrismaClient } from "@prisma/client";
import type { S1Output } from "./S1.schema";

export interface NormalizeS1Deps {
  prisma: PrismaClient;
}

export interface NormalizeS1Args {
  dealId: string;
  runId: string;
  output: S1Output;
}

const STAGE1_AGENT_IDS = ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"] as const;

/**
 * Persist S1 output:
 *   - Update Deal cache (thesisFit, nextAction, coverage)
 *   - Compute coverage as: count(stage-1 agents with status=success) / 8
 *   - Emit a DealAuditEvent of kind="thesis_generated" with the full payload
 */
export async function normalizeS1(deps: NormalizeS1Deps, args: NormalizeS1Args): Promise<void> {
  const { dealId, runId, output } = args;

  const successful = await deps.prisma.agentOutput.count({
    where: {
      runId,
      status: "success",
      agentId: { in: [...STAGE1_AGENT_IDS] },
    },
  });
  const coverage = successful / STAGE1_AGENT_IDS.length;

  await deps.prisma.deal.update({
    where: { id: dealId },
    data: {
      thesisFit: output.thesis_fit_score,
      nextAction: output.next_action,
      coverage: Number(coverage.toFixed(2)),
    },
  });

  await deps.prisma.dealAuditEvent.create({
    data: {
      dealId,
      kind: "thesis_generated",
      payload: output as unknown as Prisma.InputJsonValue,
    },
  });
}
