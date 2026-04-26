import type { PrismaClient } from "@prisma/client";
import type { S2ExistingCitation, S2ExistingFinding } from "../../agents/memo/S2.prompt";

export interface LoadMemoContextDeps {
  prisma: PrismaClient;
}

export interface MemoContext {
  findings: S2ExistingFinding[];
  citations: S2ExistingCitation[];
}

/**
 * Snapshot the Findings + Citations available to S2 at draft time. S2 may
 * reference any of these by displayId via [rfN] / [cN] inline tags.
 */
export async function loadMemoContext(
  deps: LoadMemoContextDeps,
  dealId: string,
): Promise<MemoContext> {
  const [findings, citations] = await Promise.all([
    deps.prisma.finding.findMany({
      where: { dealId },
      select: {
        displayId: true,
        agentId: true,
        externalId: true,
        severity: true,
        category: true,
        title: true,
        summary: true,
        detail: true,
        suggestedQuestion: true,
      },
      orderBy: [{ severity: "desc" }, { displayId: "asc" }],
    }),
    deps.prisma.citation.findMany({
      where: { dealId },
      select: {
        displayId: true,
        documentId: true,
        sectionRef: true,
        page: true,
        excerpt: true,
        confidence: true,
      },
      orderBy: { displayId: "asc" },
    }),
  ]);

  return {
    findings: findings.map((f) => ({
      displayId: f.displayId,
      agentId: f.agentId,
      externalId: f.externalId,
      severity: f.severity,
      category: f.category,
      title: f.title,
      summary: f.summary,
      detail: f.detail,
      suggestedQuestion: f.suggestedQuestion,
    })),
    citations,
  };
}
