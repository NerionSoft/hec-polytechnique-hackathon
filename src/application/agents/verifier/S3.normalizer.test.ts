import { describe, expect, it } from "vitest";
import { InMemoryPrismaForMemo } from "../../test-support/fakes";
import { normalizeS3 } from "./S3.normalizer";
import type { S3Output } from "./S3.schema";

function setup() {
  const prisma = new InMemoryPrismaForMemo();
  prisma.seedDeal("deal_1");
  prisma.seedRun("run_1", "deal_1");
  prisma.seedCitation({
    dealId: "deal_1",
    displayId: "c1",
    chunkId: "chunk_a",
    excerpt: "Revenue €31M",
  });
  prisma.seedCitation({
    dealId: "deal_1",
    displayId: "c2",
    chunkId: "chunk_b",
    excerpt: "EBITDA €4.2M",
  });
  // Seed a memo so Memo.update has something to find
  prisma.memos.push({
    id: "memo_1",
    dealId: "deal_1",
    runId: "run_1",
    status: "DRAFT",
    reviewProgress: null,
    pendingItems: 5,
  });
  return prisma;
}

describe("normalizeS3", () => {
  it("on pass: flips Citation.verified, sets Memo.status=REVIEW, returns shouldRedraft=false", async () => {
    const prisma = setup();
    const output: S3Output = {
      verdict: "pass",
      checked_citations_count: 2,
      checked_redflags_count: 0,
      passed_count: 2,
      pass_rate: 1,
      failures: [],
      unsupported_claims: [],
    };

    const { shouldRedraft } = await normalizeS3(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output, iteration: 0 },
    );

    expect(shouldRedraft).toBe(false);
    expect(prisma.citations.every((c) => c.verified)).toBe(true);
    expect(prisma.memos[0].status).toBe("REVIEW");
    expect(Number(String(prisma.ddRuns[0].citationPassRate))).toBe(1);
    expect(prisma.auditEvents).toHaveLength(1);
    expect(prisma.auditEvents[0].kind).toBe("citation_verifier_run");
  });

  it("on fail before max iterations: returns shouldRedraft=true and leaves memo DRAFT", async () => {
    const prisma = setup();
    const output: S3Output = {
      verdict: "fail",
      checked_citations_count: 2,
      checked_redflags_count: 0,
      passed_count: 1,
      pass_rate: 0.5,
      failures: [
        {
          section_key: "thesis",
          memo_excerpt: "EBITDA 4.2M[c2]",
          claimed_tag: "[c2]",
          issue: "quote_not_in_chunk",
          suggested_fix: "rewrite_claim_as: see snapshot",
        },
      ],
      unsupported_claims: [],
    };

    const { shouldRedraft } = await normalizeS3(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output, iteration: 0 },
    );

    expect(shouldRedraft).toBe(true);
    // c1 (not in failures) flipped, c2 (failed) stays unverified
    const byId = (id: string) => prisma.citations.find((c) => c.displayId === id)!;
    expect(byId("c1").verified).toBe(true);
    expect(byId("c2").verified).toBe(false);
    expect(prisma.memos[0].status).toBe("DRAFT");
    expect(prisma.ddRuns[0].status).toBe("RUNNING");
  });

  it("on fail at iteration 2 (last): flags Memo + Run as NEEDS_REVIEW", async () => {
    const prisma = setup();
    const output: S3Output = {
      verdict: "fail",
      checked_citations_count: 2,
      checked_redflags_count: 0,
      passed_count: 0,
      pass_rate: 0,
      failures: [
        {
          section_key: "thesis",
          memo_excerpt: "[c1]",
          claimed_tag: "[c1]",
          issue: "quote_not_in_chunk",
          suggested_fix: null,
        },
      ],
      unsupported_claims: [],
    };

    const { shouldRedraft } = await normalizeS3(
      { prisma: prisma as never },
      { dealId: "deal_1", runId: "run_1", output, iteration: 2 },
    );

    expect(shouldRedraft).toBe(false);
    expect(prisma.memos[0].status).toBe("NEEDS_REVIEW");
    expect(prisma.ddRuns[0].status).toBe("NEEDS_REVIEW");
  });
});
