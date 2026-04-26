import { describe, expect, it } from "vitest";
import { normalizeA2 } from "@/src/application/agents/financial/A2.normalizer";
import type { A2Output } from "@/src/application/agents/financial/A2.schema";

interface UpdateCall {
  where: { id: string };
  data: Record<string, unknown>;
}

interface UpsertCall {
  where: { dealId: string };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

function makePrismaSpy() {
  const dealUpdates: UpdateCall[] = [];
  const snapshotUpserts: UpsertCall[] = [];

  const prisma = {
    deal: {
      update: async (args: UpdateCall) => {
        dealUpdates.push(args);
        return {} as never;
      },
    },
    financialSnapshot: {
      upsert: async (args: UpsertCall) => {
        snapshotUpserts.push(args);
        return {} as never;
      },
    },
  };
  return { prisma, dealUpdates, snapshotUpserts };
}

const baseOutput: A2Output = {
  period_covered: { from: "FY2022", to: "FY2024" },
  currency: "EUR",
  deal_kpi_sync: {
    revenue_eur: 31_000_000,
    ebitda_eur: 4_200_000,
    ebitda_margin: 0.135,
    growth_yoy: 0.18,
    net_debt_ebitda: 3.4,
    employees: 142,
    founded: 2014,
    evidence: [],
  },
  trend_view: [
    {
      period: "FY2024",
      revenue_m: 31.0,
      ebitda_m: 4.2,
      evidence: [],
    },
  ],
  working_capital_view: [{ period: "FY2024", dso: 68, dpo: 47, dio: 44, evidence: [] }],
  kpi_view: {
    revenue_m: 31.0,
    ebitda_m: 4.2,
    ebitda_margin: 0.135,
    growth_yoy: 0.18,
    net_debt_ebitda: 3.4,
    headcount: 142,
    client_count: 40,
    evidence: [],
  },
  trend_commentary:
    "Revenue grew from €17.5M (FY2021) to €31.0M (FY2024). EBITDA margin contracted from 15.0% to 13.5% over the same period.",
  gaps: [],
  p_and_l_revenue: [],
  p_and_l_ebitda: [],
};

describe("normalizeA2", () => {
  it("syncs Deal KPI columns from deal_kpi_sync", async () => {
    const { prisma, dealUpdates } = makePrismaSpy();

    await normalizeA2(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output: baseOutput },
    );

    expect(dealUpdates).toHaveLength(1);
    expect(dealUpdates[0]).toEqual({
      where: { id: "deal_1" },
      data: {
        revenueEur: 31_000_000,
        ebitdaEur: 4_200_000,
        ebitdaMargin: 0.135,
        growthYoy: 0.18,
        netDebtEbitda: 3.4,
        employees: 142,
        founded: 2014,
      },
    });
  });

  it("upserts the FinancialSnapshot with trend / kpi / WC views and empty A4/A5 placeholders", async () => {
    const { prisma, snapshotUpserts } = makePrismaSpy();

    await normalizeA2(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output: baseOutput },
    );

    expect(snapshotUpserts).toHaveLength(1);
    const call = snapshotUpserts[0];
    expect(call.where.dealId).toBe("deal_1");
    expect(call.create).toMatchObject({
      dealId: "deal_1",
      runId: "run_1",
      trendJson: baseOutput.trend_view,
      kpiJson: baseOutput.kpi_view,
      workingCapitalJson: baseOutput.working_capital_view,
      bridgeJson: [],
      concentrationJson: [],
      retentionJson: {},
    });
    expect(call.update).toMatchObject({
      runId: "run_1",
      trendJson: baseOutput.trend_view,
      kpiJson: baseOutput.kpi_view,
      workingCapitalJson: baseOutput.working_capital_view,
    });
    // Update path must NOT touch the A4/A5 fields (preserves their work)
    expect(call.update).not.toHaveProperty("bridgeJson");
    expect(call.update).not.toHaveProperty("concentrationJson");
    expect(call.update).not.toHaveProperty("retentionJson");
  });

  it("skips Deal columns where the agent reported null", async () => {
    const { prisma, dealUpdates } = makePrismaSpy();
    const output: A2Output = {
      ...baseOutput,
      deal_kpi_sync: {
        ...baseOutput.deal_kpi_sync,
        revenue_eur: null,
        ebitda_eur: null,
        net_debt_ebitda: null,
        founded: null,
      },
    };

    await normalizeA2({ prisma: prisma as never }, { dealId: "deal_1", runId: "run_1", output });

    const data = dealUpdates[0].data;
    expect(data.revenueEur).toBeUndefined();
    expect(data.ebitdaEur).toBeUndefined();
    expect(data.netDebtEbitda).toBeUndefined();
    expect(data.founded).toBeUndefined();
    // Non-null fields still propagate
    expect(data.ebitdaMargin).toBe(0.135);
    expect(data.employees).toBe(142);
  });
});
