import type { PrismaClient } from "@prisma/client";
import type { Confidence } from "./findingShape";
import type { Evidence } from "./evidence";
import { nextDisplayId } from "./displayId";

export interface UpsertCitationDeps {
  prisma: PrismaClient;
}

/**
 * Insert (or fetch existing) Citation row from an evidence item.
 *
 * Dedup key: (dealId, chunkId, excerpt[:120]) — same chunk + same quote =
 * same citation. Different agents quoting the same passage will share an ID.
 *
 * Returns the Citation primary key (cuid), NOT the displayId.
 */
export async function upsertCitationFromEvidence(
  deps: UpsertCitationDeps,
  args: {
    dealId: string;
    evidence: Evidence;
    confidence?: Confidence;
  },
): Promise<string> {
  const { dealId, evidence, confidence = "MEDIUM" } = args;

  const existing = await deps.prisma.citation.findFirst({
    where: {
      dealId,
      chunkId: evidence.chunk_id,
      excerpt: evidence.quote,
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const displayId = await nextDisplayId(deps.prisma, "c", dealId);

  const created = await deps.prisma.citation.create({
    data: {
      dealId,
      displayId,
      documentId: evidence.doc_id,
      chunkId: evidence.chunk_id,
      sectionRef: evidence.section,
      page: evidence.page ?? null,
      excerpt: evidence.quote,
      confidence,
      verified: false,
      usedIn: [],
    },
    select: { id: true },
  });

  return created.id;
}
