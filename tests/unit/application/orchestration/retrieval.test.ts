import { describe, expect, it } from "vitest";
import { retrieveForAgent } from "@/src/application/orchestration/retrieval";

function makePrisma(documents: unknown[], chunks: unknown[]) {
  return {
    document: {
      findMany: async () => documents,
    },
    chunk: {
      findMany: async () => chunks,
    },
  };
}

describe("retrieveForAgent", () => {
  it("returns no chunks for A1, S1, S2, S3 (they don't take retrieval)", async () => {
    const prisma = makePrisma([], []);
    for (const id of ["A1", "S1", "S2", "S3"] as const) {
      const result = await retrieveForAgent(
        { prisma: prisma as never },
        { agentId: id, dealId: "deal_1" },
      );
      expect(result).toEqual([]);
    }
  });

  it("merges Document.filename into each chunk", async () => {
    const prisma = makePrisma(
      [
        { id: "doc_1", filename: "audit_2024.pdf" },
        { id: "doc_2", filename: "budget_2024.pdf" },
      ],
      [
        {
          id: "chunk_1",
          documentId: "doc_1",
          sectionRef: "§3.2",
          page: 12,
          text: "Revenue €31M",
        },
        {
          id: "chunk_2",
          documentId: "doc_2",
          sectionRef: null,
          page: null,
          text: "Forecast 2025",
        },
      ],
    );

    const chunks = await retrieveForAgent(
      { prisma: prisma as never },
      { agentId: "A2", dealId: "deal_1" },
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0].filename).toBe("audit_2024.pdf");
    expect(chunks[1].filename).toBe("budget_2024.pdf");
    expect(chunks[0].sectionRef).toBe("§3.2");
  });

  it("returns empty when no documents are routed to the agent", async () => {
    const prisma = makePrisma([], []);
    const result = await retrieveForAgent(
      { prisma: prisma as never },
      { agentId: "A6", dealId: "deal_1" },
    );
    expect(result).toEqual([]);
  });
});
