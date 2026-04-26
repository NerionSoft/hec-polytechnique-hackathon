import { describe, expect, it } from "vitest";
import { normalizeA1 } from "@/src/application/agents/triage/A1.normalizer";
import type { A1Output } from "@/src/application/agents/triage/A1.schema";

interface UpdateCall {
  where: { id: string };
  data: Record<string, unknown>;
}

function makePrismaSpy() {
  const updates: UpdateCall[] = [];
  const document = {
    update: async (args: UpdateCall) => {
      updates.push(args);
      return {} as never;
    },
  };
  return { prisma: { document }, updates };
}

const baseOutput: A1Output = {
  doc_id: "doc_1",
  front_category: "FINANCIAL",
  pe_taxonomy: ["financial.audit"],
  deal_relevance: 5,
  risk_signal: 1,
  redflag_keywords_hit: [],
  route_to_agents: ["A2", "A3"],
  evidence: [],
  gap: null,
};

describe("normalizeA1", () => {
  it("writes the front category, taxonomy and routing onto the document", async () => {
    const { prisma, updates } = makePrismaSpy();

    await normalizeA1({ prisma: prisma as never }, baseOutput);

    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({
      where: { id: "doc_1" },
      data: {
        category: "FINANCIAL",
        peTaxonomy: ["financial.audit"],
        dealRelevance: 5,
        riskSignal: 1,
        routedTo: ["A2", "A3"],
        redflagKeywords: [],
        status: "INDEXED",
      },
    });
  });

  it("falls back to the taxonomy mapping when front_category is omitted", async () => {
    const { prisma, updates } = makePrismaSpy();
    const output = {
      ...baseOutput,
      front_category: undefined as unknown as A1Output["front_category"],
      pe_taxonomy: ["customer.contract.tier1"],
    } satisfies A1Output;

    await normalizeA1({ prisma: prisma as never }, output);

    expect(updates[0].data.category).toBe("LEGAL");
  });

  it("flips status to FAILED on extraction gap", async () => {
    const { prisma, updates } = makePrismaSpy();
    const output: A1Output = {
      ...baseOutput,
      pe_taxonomy: ["other"],
      gap: {
        field: "extraction",
        reason: "extraction_failed_pdf_or_ocr_required",
        suggested_request: null,
      },
    };

    await normalizeA1({ prisma: prisma as never }, output);

    expect(updates[0].data.status).toBe("FAILED");
  });

  it("preserves redflag keyword hits verbatim", async () => {
    const { prisma, updates } = makePrismaSpy();
    const output: A1Output = {
      ...baseOutput,
      risk_signal: 4,
      redflag_keywords_hit: ["material adverse", "going concern"],
    };

    await normalizeA1({ prisma: prisma as never }, output);

    expect(updates[0].data.redflagKeywords).toEqual(["material adverse", "going concern"]);
  });
});
