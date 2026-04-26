import { describe, expect, it } from "vitest";
import { InMemoryPrismaForMemo } from "../../test-support/fakes";
import { normalizeS2 } from "./S2.normalizer";
import type { S2Output } from "./S2.schema";

function makeBaseOutput(): S2Output {
  return {
    memo_status: "DRAFT",
    review_progress: 0,
    pending_items: 5,
    sections: [
      {
        section_key: "thesis",
        title: "Investment Thesis",
        body: "Helios grew revenue from €X to €Y[c1]. EBITDA margin 13.5%[c2].",
        reviewed: false,
        citations_used: ["c1", "c2"],
        redflags_used: [],
      },
      {
        section_key: "snapshot",
        title: "Financial Snapshot",
        body: "Revenue FY24 €31M[c1]; EBITDA €4.2M[c2]; Net Debt[new_1].",
        reviewed: false,
        citations_used: ["c1", "c2"],
        redflags_used: [],
      },
      {
        section_key: "risks",
        title: "Key Risks & Mitigants",
        body: "• HIGH: Customer concentration[rf1] — top-3 = 64%. Mitigant: condition closing.",
        reviewed: false,
        citations_used: [],
        redflags_used: ["rf1"],
      },
      {
        section_key: "questions",
        title: "Questions for Management",
        body: "1. What is the renewal status? [rf1]",
        reviewed: false,
        citations_used: [],
        redflags_used: ["rf1"],
      },
      {
        section_key: "recommendation",
        title: "IC Recommendation",
        body: "Proceed subject to (i) NordPlast waiver; (ii) Carrefour renewal.",
        reviewed: false,
        citations_used: [],
        redflags_used: [],
      },
    ],
    new_citations: [
      {
        tmp_ref: "new_1",
        doc_id: "doc_1",
        chunk_id: "chunk_99",
        section: "§2.1",
        page: 28,
        excerpt: "Net debt as of 31 Dec 2024: €14,278,000.",
        confidence: "HIGH",
      },
    ],
  };
}

function seedExisting(prisma: InMemoryPrismaForMemo): void {
  prisma.seedDeal("deal_1");
  prisma.seedRun("run_1", "deal_1");
  prisma.seedCitation({
    dealId: "deal_1",
    displayId: "c1",
    chunkId: "chunk_a",
    excerpt: "Revenue FY24 €31M",
  });
  prisma.seedCitation({
    dealId: "deal_1",
    displayId: "c2",
    chunkId: "chunk_b",
    excerpt: "EBITDA €4.2M",
  });
  prisma.seedFinding({ dealId: "deal_1", displayId: "rf1" });
}

describe("normalizeS2", () => {
  it("creates new citations, rewrites tmp_ref tags, and upserts the memo + 5 sections", async () => {
    const prisma = new InMemoryPrismaForMemo();
    seedExisting(prisma);

    const output = makeBaseOutput();
    const { memoId, sectionIds } = await normalizeS2(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output },
    );

    expect(sectionIds).toHaveLength(5);
    expect(prisma.memos).toHaveLength(1);
    expect(prisma.memoSections).toHaveLength(5);

    // tmp_ref "new_1" was rewritten to the next allocated displayId "c3".
    const snapshot = prisma.memoSections.find((s) => s.sectionKey === "snapshot")!;
    expect(snapshot.body).not.toContain("[new_1]");
    expect(snapshot.body).toContain("[c3]");

    const memo = prisma.memos[0];
    expect(memo.id).toBe(memoId);
    expect(memo.status).toBe("DRAFT");

    // Sections are ordered correctly.
    const order = prisma.memoSections.map((s) => s.sectionKey);
    expect(order).toEqual(["thesis", "snapshot", "risks", "questions", "recommendation"]);

    // Citation.usedIn was extended for c1, c2 (used in thesis + snapshot).
    const c1 = prisma.citations.find((c) => c.displayId === "c1")!;
    expect(c1.usedIn).toEqual(["thesis", "snapshot"]);
    const c2 = prisma.citations.find((c) => c.displayId === "c2")!;
    expect(c2.usedIn).toEqual(["thesis", "snapshot"]);
    const c3 = prisma.citations.find((c) => c.displayId === "c3")!;
    expect(c3.usedIn).toEqual(["snapshot"]);
  });

  it("throws when a body references an unknown citation", async () => {
    const prisma = new InMemoryPrismaForMemo();
    seedExisting(prisma);
    const output = makeBaseOutput();
    output.sections[0].body = "Bogus reference [c99].";
    output.sections[0].citations_used = ["c99"];

    await expect(
      normalizeS2({ prisma: prisma as never }, { dealId: "deal_1", runId: "run_1", output }),
    ).rejects.toThrow(/unknown citation c99/);
  });

  it("throws when a body references an unknown red flag", async () => {
    const prisma = new InMemoryPrismaForMemo();
    seedExisting(prisma);
    const output = makeBaseOutput();
    output.sections[2].body = "• HIGH: phantom finding[rf99].";
    output.sections[2].redflags_used = ["rf99"];

    await expect(
      normalizeS2({ prisma: prisma as never }, { dealId: "deal_1", runId: "run_1", output }),
    ).rejects.toThrow(/unknown red flag rf99/);
  });
});
