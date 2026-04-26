import { describe, expect, it } from "vitest";
import { InMemoryPrismaForMemo } from "../../test-support/fakes";
import { normalizeS1 } from "./S1.normalizer";
import type { S1Output } from "./S1.schema";

const baseOutput: S1Output = {
  one_liner: "French specialty-crop platform with EU consolidation potential.",
  thesis_pillars: [
    {
      pillar: "EU specialty-crop consolidation",
      supporting_facts: [
        { fact: "18% YoY revenue growth", source_agent: "A2", source_finding_external_id: null },
      ],
    },
    {
      pillar: "Cross-sell precision-irrigation module",
      supporting_facts: [
        { fact: "12% attach rate today", source_agent: "A8", source_finding_external_id: null },
      ],
    },
    {
      pillar: "DACH expansion runway",
      supporting_facts: [
        { fact: "DACH = 7% of revenue", source_agent: "A2", source_finding_external_id: null },
      ],
    },
  ],
  key_value_creation_levers: [
    {
      lever: "cross_sell",
      evidence_basis: [{ source_agent: "A8", finding_external_id: null }],
      tied_to_redflag_or_opportunity: "precision-irrigation attach rate gap",
    },
  ],
  top_risks_summarized: [
    { risk: "Top-3 customer concentration", severity: "HIGH", source_agent: "A3" },
  ],
  thesis_fit_score: 87,
  thesis_fit_rationale: "Base 50 + sector match + EU geo + recurring revenue, − 1×HIGH.",
  next_action: "Review legal red flags",
  go_no_go_signal: "go_deeper",
  rationale: "Coverage adequate per A2/A5; A7 surfaced no critical walk-aways.",
};

describe("normalizeS1", () => {
  it("syncs Deal cache columns and emits the audit event", async () => {
    const prisma = new InMemoryPrismaForMemo();
    prisma.seedDeal("deal_1");
    prisma.seedRun("run_1", "deal_1");
    // 6 successful stage-1 agents → coverage 6/8 = 0.75
    for (const a of ["A2", "A3", "A4", "A5", "A6", "A7"]) {
      prisma.seedAgentOutput("run_1", a, "success");
    }
    prisma.seedAgentOutput("run_1", "A8", "failed");
    prisma.seedAgentOutput("run_1", "A9", "running");

    await normalizeS1(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output: baseOutput },
    );

    const deal = prisma.deals[0];
    expect(deal.thesisFit).toBe(87);
    expect(deal.nextAction).toBe("Review legal red flags");
    expect(String(deal.coverage)).toBe("0.75");

    expect(prisma.auditEvents).toHaveLength(1);
    expect(prisma.auditEvents[0].kind).toBe("thesis_generated");
    expect(prisma.auditEvents[0].dealId).toBe("deal_1");
  });

  it("computes coverage = 1.0 when all 8 stage-1 agents succeeded", async () => {
    const prisma = new InMemoryPrismaForMemo();
    prisma.seedDeal("deal_1");
    prisma.seedRun("run_1", "deal_1");
    for (const a of ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"]) {
      prisma.seedAgentOutput("run_1", a, "success");
    }

    await normalizeS1(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output: baseOutput },
    );

    expect(Number(String(prisma.deals[0].coverage))).toBe(1);
  });

  it("rounds coverage to two decimals (Prisma.Decimal normalizes trailing zeros)", async () => {
    const prisma = new InMemoryPrismaForMemo();
    prisma.seedDeal("deal_1");
    prisma.seedRun("run_1", "deal_1");
    // 6/8 succeeded → 0.75 (no trailing zero stripping needed)
    for (const a of ["A2", "A3", "A4", "A5", "A6", "A7"]) {
      prisma.seedAgentOutput("run_1", a, "success");
    }

    await normalizeS1(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output: baseOutput },
    );

    expect(String(prisma.deals[0].coverage)).toBe("0.75");
  });
});
