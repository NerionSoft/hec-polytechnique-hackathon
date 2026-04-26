import { describe, expect, it } from "vitest";
import { InMemoryPrismaForFindings } from "@/tests/shared/test-support/fakes";
import type { SharedFinding } from "@/src/application/agents/shared/findingShape";
import { normalizeFindings } from "@/src/application/agents/shared/findingNormalizer";

function makeFinding(overrides: Partial<SharedFinding> = {}): SharedFinding {
  return {
    external_id: "QOE-001",
    severity: "HIGH",
    category: "FINANCIAL",
    title: "Aggressive consulting fees add-back",
    summary: "Recurring 3 years in a row, treated as one-off.",
    detail:
      "Management presents €0.7M consulting fees as one-off; the same line appears in FY22 and FY23 budgets.",
    confidence: "MEDIUM",
    impact: "Adjusted EBITDA may be overstated by €0.7M.",
    primary_evidence_index: 0,
    evidence: [
      {
        doc_id: "doc_1",
        section: "§4.1",
        page: 12,
        quote: "Consulting fees: €700,000 (one-off restructuring)",
        chunk_id: "chunk_1",
      },
      {
        doc_id: "doc_2",
        section: "§3.2",
        page: 8,
        quote: "Consulting fees: €680,000 (one-off)",
        chunk_id: "chunk_2",
      },
    ],
    management_question:
      "Can management substantiate the recurring nature of the €0.7M consulting fee add-back?",
    deal_impact: "price_chip",
    exposure_eur: null,
    ...overrides,
  };
}

describe("normalizeFindings", () => {
  it("creates citations, finding, and management question with sequential displayIds", async () => {
    const prisma = new InMemoryPrismaForFindings();

    const result = await normalizeFindings(
      { prisma: prisma as never },
      {
        agentId: "A3",
        dealId: "deal_1",
        runId: "run_1",
        findings: [makeFinding()],
      },
    );

    expect(result.findingIds).toHaveLength(1);
    expect(result.questionIds).toHaveLength(1);
    expect(result.citationIds).toHaveLength(2);

    expect(prisma.citations.map((c) => c.displayId)).toEqual(["c1", "c2"]);
    expect(prisma.findings[0].displayId).toBe("rf1");
    expect(prisma.questions[0].displayId).toBe("q1");

    const finding = prisma.findings[0];
    expect(finding.agentId).toBe("A3");
    expect(finding.category).toBe("FINANCIAL");
    expect(finding.severity).toBe("HIGH");
    expect(finding.confidence).toBe("MEDIUM");
    expect(finding.suggestedQuestion).toContain("consulting");
    expect(finding.primaryCitationId).toBe(prisma.citations[0].id);
    expect(finding.citationIds).toEqual(prisma.citations.map((c) => c.id));

    const question = prisma.questions[0];
    expect(question.derivedFromFindingId).toBe(finding.id);
    expect(question.topic).toBe("FINANCIAL");
  });

  it("dedupes citations on (chunkId + excerpt) across findings", async () => {
    const prisma = new InMemoryPrismaForFindings();

    const findingA = makeFinding({ external_id: "QOE-001" });
    const findingB = makeFinding({
      external_id: "QOE-002",
      // Same evidence as A — must reuse citations.
      evidence: findingA.evidence,
    });

    await normalizeFindings(
      { prisma: prisma as never },
      {
        agentId: "A3",
        dealId: "deal_1",
        runId: "run_1",
        findings: [findingA, findingB],
      },
    );

    expect(prisma.citations).toHaveLength(2);
    expect(prisma.findings).toHaveLength(2);
    // Both findings should reference the same citation IDs.
    expect(prisma.findings[0].citationIds).toEqual(prisma.findings[1].citationIds);
    // Both questions still get sequential displayIds.
    expect(prisma.questions.map((q) => q.displayId)).toEqual(["q1", "q2"]);
  });

  it("forces the category when forceCategory is provided", async () => {
    const prisma = new InMemoryPrismaForFindings();

    await normalizeFindings(
      { prisma: prisma as never },
      {
        agentId: "A6",
        dealId: "deal_1",
        runId: "run_1",
        findings: [makeFinding({ category: "OPERATIONAL" })],
        forceCategory: "FINANCIAL",
      },
    );

    expect(prisma.findings[0].category).toBe("FINANCIAL");
  });

  it("uses topicFor to override the question topic", async () => {
    const prisma = new InMemoryPrismaForFindings();

    await normalizeFindings(
      { prisma: prisma as never },
      {
        agentId: "A9",
        dealId: "deal_1",
        runId: "run_1",
        findings: [makeFinding({ category: "ESG" })],
        topicFor: () => "OPERATIONAL",
      },
    );

    expect(prisma.findings[0].category).toBe("ESG");
    expect(prisma.questions[0].topic).toBe("OPERATIONAL");
  });

  it("skips question creation when finding has no management_question", async () => {
    const prisma = new InMemoryPrismaForFindings();

    await normalizeFindings(
      { prisma: prisma as never },
      {
        agentId: "A3",
        dealId: "deal_1",
        runId: "run_1",
        findings: [makeFinding({ management_question: null })],
      },
    );

    expect(prisma.findings).toHaveLength(1);
    expect(prisma.questions).toHaveLength(0);
  });

  it("clamps an out-of-range primary_evidence_index to 0", async () => {
    const prisma = new InMemoryPrismaForFindings();

    await normalizeFindings(
      { prisma: prisma as never },
      {
        agentId: "A3",
        dealId: "deal_1",
        runId: "run_1",
        findings: [makeFinding({ primary_evidence_index: 99 })],
      },
    );

    const finding = prisma.findings[0];
    expect(finding.primaryCitationId).toBe(prisma.citations[0].id);
  });
});
