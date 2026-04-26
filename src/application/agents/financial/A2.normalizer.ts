import type { Prisma, PrismaClient } from "@prisma/client";
import type { A2Output } from "./A2.schema";

export interface NormalizeA2Deps {
  prisma: Pick<PrismaClient, "deal" | "financialSnapshot">;
}

export interface NormalizeA2Args {
  dealId: string;
  runId: string;
  output: A2Output;
}

/**
 * Persist A2 output:
 *   - Update Deal cache columns (revenueEur, ebitdaEur, ebitdaMargin, ...)
 *   - Upsert FinancialSnapshot with the trend / kpi / workingCapital views
 *
 * Idempotent: re-running the same A2 output yields the same DB state.
 * The bridge / concentration / retention views are owned by A4 / A5 and are
 * preserved across re-runs (we never overwrite them with empty arrays).
 */
export async function normalizeA2(deps: NormalizeA2Deps, args: NormalizeA2Args): Promise<void> {
  const { dealId, runId, output } = args;
  const k = output.deal_kpi_sync;

  await deps.prisma.deal.update({
    where: { id: dealId },
    data: {
      revenueEur: numberOrUndefined(k.revenue_eur),
      ebitdaEur: numberOrUndefined(k.ebitda_eur),
      ebitdaMargin: numberOrUndefined(k.ebitda_margin),
      growthYoy: numberOrUndefined(k.growth_yoy),
      netDebtEbitda: numberOrUndefined(k.net_debt_ebitda),
      employees: integerOrUndefined(k.employees),
      founded: integerOrUndefined(k.founded),
    },
  });

  const trendJson = output.trend_view as unknown as Prisma.InputJsonValue;
  const kpiJson = output.kpi_view as unknown as Prisma.InputJsonValue;
  const workingCapitalJson = (output.working_capital_view ??
    []) as unknown as Prisma.InputJsonValue;

  await deps.prisma.financialSnapshot.upsert({
    where: { dealId },
    create: {
      dealId,
      runId,
      trendJson,
      kpiJson,
      workingCapitalJson,
      bridgeJson: [] as unknown as Prisma.InputJsonValue, // owned by A4 normalizer
      concentrationJson: [] as unknown as Prisma.InputJsonValue, // owned by A5
      retentionJson: {} as unknown as Prisma.InputJsonValue, // owned by A5
    },
    update: {
      runId,
      trendJson,
      kpiJson,
      workingCapitalJson,
    },
  });
}

function numberOrUndefined(v: number | null): number | undefined {
  return v == null ? undefined : v;
}

function integerOrUndefined(v: number | null): number | undefined {
  if (v == null) return undefined;
  return Math.trunc(v);
}
