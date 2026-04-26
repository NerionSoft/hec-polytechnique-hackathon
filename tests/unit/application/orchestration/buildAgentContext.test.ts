import { describe, expect, it } from "vitest";
import { buildAgentContext } from "@/src/application/orchestration/buildAgentContext";

function makePrisma(run: unknown) {
  return {
    dDRun: {
      findUnique: async () => run,
    },
  };
}

describe("buildAgentContext", () => {
  it("hydrates from DDRun → Deal → Lead", async () => {
    const prisma = makePrisma({
      id: "run_1",
      deal: {
        id: "deal_1",
        ownerId: "user_1",
        thesisId: "thesis_1",
        lead: {
          id: "lead_1",
          country: "FR",
          sector: "Agritech",
        },
      },
    });

    const ctx = await buildAgentContext(
      { prisma: prisma as never },
      { runId: "run_1", asOfDate: "2026-04-26" },
    );

    expect(ctx).toEqual({
      runId: "run_1",
      dealId: "deal_1",
      leadId: "lead_1",
      ownerId: "user_1",
      thesisId: "thesis_1",
      industry: "Agritech",
      geographies: ["FR"],
      fiscalYearEnd: "12-31",
      asOfDate: "2026-04-26",
      currency: "EUR",
    });
  });

  it("throws when the run is missing", async () => {
    const prisma = makePrisma(null);
    await expect(
      buildAgentContext(
        { prisma: prisma as never },
        { runId: "run_missing", asOfDate: "2026-04-26" },
      ),
    ).rejects.toThrow(/run_missing not found/);
  });

  it("yields empty geographies when the lead has no country", async () => {
    const prisma = makePrisma({
      id: "run_1",
      deal: {
        id: "deal_1",
        ownerId: "user_1",
        thesisId: null,
        lead: { id: "lead_1", country: null, sector: null },
      },
    });

    const ctx = await buildAgentContext(
      { prisma: prisma as never },
      { runId: "run_1", asOfDate: "2026-04-26" },
    );

    expect(ctx.geographies).toEqual([]);
    expect(ctx.industry).toBeNull();
    expect(ctx.thesisId).toBeNull();
  });
});
