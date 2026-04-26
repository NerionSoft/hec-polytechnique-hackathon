import type { Prisma, PrismaClient } from "@prisma/client";
import { normalizeFindings } from "../shared/findingNormalizer";
import type { A5Output } from "./A5.schema";

export interface NormalizeA5Deps {
  prisma: PrismaClient;
}

export interface NormalizeA5Args {
  dealId: string;
  runId: string;
  output: A5Output;
}

/**
 * Persist A5 output:
 *   - Write concentration_view + retention_view onto FinancialSnapshot
 *   - Emit Findings + ManagementQuestions for every breached threshold
 */
export async function normalizeA5(
  deps: NormalizeA5Deps,
  args: NormalizeA5Args,
): Promise<{ findingIds: string[]; questionIds: string[] }> {
  const { dealId, runId, output } = args;

  const concentrationJson = output.concentration_view as unknown as Prisma.InputJsonValue;
  const retentionJson = output.retention_view as unknown as Prisma.InputJsonValue;

  await deps.prisma.financialSnapshot.upsert({
    where: { dealId },
    create: {
      dealId,
      runId,
      trendJson: [] as unknown as Prisma.InputJsonValue,
      kpiJson: {} as unknown as Prisma.InputJsonValue,
      workingCapitalJson: [] as unknown as Prisma.InputJsonValue,
      bridgeJson: [] as unknown as Prisma.InputJsonValue,
      concentrationJson,
      retentionJson,
    },
    update: { concentrationJson, retentionJson },
  });

  if (output.redflag_findings.length === 0) {
    return { findingIds: [], questionIds: [] };
  }

  const result = await normalizeFindings(deps, {
    agentId: "A5",
    dealId,
    runId,
    findings: output.redflag_findings,
    forceCategory: "COMMERCIAL",
  });
  return { findingIds: result.findingIds, questionIds: result.questionIds };
}
