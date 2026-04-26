import type { PrismaClient } from "@prisma/client";
import type { AgentContext } from "../agents/shared/agentTypes";

export interface BuildAgentContextDeps {
  prisma: PrismaClient;
}

export interface BuildAgentContextArgs {
  runId: string;
  asOfDate: string;
}

/**
 * Hydrate an AgentContext from a DDRun + its parent Deal + Lead.
 * Throws if the run is orphaned (defensive — should never happen).
 */
export async function buildAgentContext(
  deps: BuildAgentContextDeps,
  args: BuildAgentContextArgs,
): Promise<AgentContext> {
  const run = await deps.prisma.dDRun.findUnique({
    where: { id: args.runId },
    include: {
      deal: {
        include: { lead: true },
      },
    },
  });
  if (!run) throw new Error(`DDRun ${args.runId} not found`);
  const { deal } = run;
  const { lead } = deal;

  const geographies = lead.country ? [lead.country] : [];
  return {
    runId: run.id,
    dealId: deal.id,
    leadId: lead.id,
    ownerId: deal.ownerId,
    thesisId: deal.thesisId ?? null,
    industry: lead.sector ?? null,
    geographies,
    fiscalYearEnd: "12-31",
    asOfDate: args.asOfDate,
    currency: "EUR",
  };
}
