import type { Prisma, PrismaClient } from "@prisma/client";
import type { SharedFinding } from "../shared/findingShape";
import { normalizeFindings } from "../shared/findingNormalizer";
import type { A4Output } from "./A4.schema";

export interface NormalizeA4Deps {
  prisma: PrismaClient;
}

export interface NormalizeA4Args {
  dealId: string;
  runId: string;
  output: A4Output;
}

/**
 * Persist A4 output:
 *   - Push bridge_view onto FinancialSnapshot.bridgeJson
 *   - Update Deal.ebitdaEur with the adjusted value (only if positive and known)
 *   - For every aggressive adjustment, create a Finding via the shared normalizer
 *
 * Idempotent on bridgeJson (overwrite). Findings are append-only by run.
 */
export async function normalizeA4(
  deps: NormalizeA4Deps,
  args: NormalizeA4Args,
): Promise<{ findingIds: string[]; questionIds: string[] }> {
  const { dealId, runId, output } = args;

  const bridgeJson = output.bridge_view as unknown as Prisma.InputJsonValue;
  await deps.prisma.financialSnapshot.upsert({
    where: { dealId },
    create: {
      dealId,
      runId,
      trendJson: [] as unknown as Prisma.InputJsonValue,
      kpiJson: {} as unknown as Prisma.InputJsonValue,
      workingCapitalJson: [] as unknown as Prisma.InputJsonValue,
      concentrationJson: [] as unknown as Prisma.InputJsonValue,
      retentionJson: {} as unknown as Prisma.InputJsonValue,
      bridgeJson,
    },
    update: { bridgeJson },
  });

  if (output.adjusted_ebitda_eur != null && output.adjusted_ebitda_eur > 0) {
    await deps.prisma.deal.update({
      where: { id: dealId },
      data: { ebitdaEur: output.adjusted_ebitda_eur },
    });
  }

  const aggressiveFindings: SharedFinding[] = output.adjustments
    .filter((a) => a.is_aggressive)
    .map((a) => ({
      external_id: a.external_id,
      severity: a.confidence === "LOW" ? "HIGH" : "MEDIUM",
      category: "FINANCIAL",
      title: `Aggressive add-back — ${a.label}`,
      summary: a.rationale,
      detail: a.rationale,
      confidence: a.confidence,
      impact:
        a.amount_eur != null
          ? `Adjusted EBITDA may be overstated by ~${formatEur(a.amount_eur, output.currency)}.`
          : "Magnitude not quantified in source — investigation required.",
      primary_evidence_index: 0,
      evidence: a.evidence,
      management_question: a.management_question ?? null,
      exposure_eur: a.amount_eur,
      deal_impact: null,
    }));

  if (aggressiveFindings.length === 0) {
    return { findingIds: [], questionIds: [] };
  }

  const result = await normalizeFindings(deps, {
    agentId: "A4",
    dealId,
    runId,
    findings: aggressiveFindings,
    forceCategory: "FINANCIAL",
  });
  return { findingIds: result.findingIds, questionIds: result.questionIds };
}

function formatEur(n: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(0)}k`;
  return `${symbol}${n}`;
}
