import type { PrismaClient } from "@prisma/client";
import type {
  S3CitationLookup,
  S3ChunkLookup,
  S3MemoSection,
} from "../../agents/verifier/S3.prompt";

export interface LoadVerifierInputDeps {
  prisma: PrismaClient;
}

export interface VerifierInput {
  memo_sections: S3MemoSection[];
  citations: S3CitationLookup[];
  finding_display_ids: string[];
  chunk_store: S3ChunkLookup[];
}

/**
 * Gather the full payload S3 needs to verify the persisted memo:
 *   - All MemoSection rows (in display order)
 *   - All Citation rows + the Chunk text they should match
 *   - All Finding displayIds (rfN) so S3 can validate [rfN] tags
 */
export async function loadVerifierInput(
  deps: LoadVerifierInputDeps,
  dealId: string,
): Promise<VerifierInput> {
  const memo = await deps.prisma.memo.findUnique({
    where: { dealId },
    include: {
      sections: { orderBy: { orderIdx: "asc" } },
    },
  });
  if (!memo) {
    throw new Error(`No memo for deal ${dealId} — S2 must run before S3`);
  }

  const citations = await deps.prisma.citation.findMany({
    where: { dealId },
    select: {
      displayId: true,
      chunkId: true,
      page: true,
      excerpt: true,
    },
  });

  const findings = await deps.prisma.finding.findMany({
    where: { dealId },
    select: { displayId: true },
  });

  // Pull the chunks referenced by any citation in one query
  const chunkIds = Array.from(
    new Set(citations.map((c) => c.chunkId).filter((id): id is string => Boolean(id))),
  );
  const chunks = chunkIds.length
    ? await deps.prisma.chunk.findMany({
        where: { id: { in: chunkIds } },
        select: { id: true, page: true, text: true },
      })
    : [];

  const memoSections: S3MemoSection[] = memo.sections.map((s) => ({
    section_key: s.sectionKey as S3MemoSection["section_key"],
    body: s.body,
  }));

  return {
    memo_sections: memoSections,
    citations: citations.map((c) => ({
      displayId: c.displayId,
      chunkId: c.chunkId,
      page: c.page,
      excerpt: c.excerpt,
    })),
    finding_display_ids: findings.map((f) => f.displayId),
    chunk_store: chunks,
  };
}
