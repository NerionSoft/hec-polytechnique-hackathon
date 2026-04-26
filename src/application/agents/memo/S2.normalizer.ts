import type { PrismaClient } from "@prisma/client";
import { nextDisplayId } from "../shared/displayId";
import {
  SECTION_ORDER,
  defaultSectionTitle,
  type S2Output,
  type MemoSectionKey,
} from "./S2.schema";

export interface NormalizeS2Deps {
  prisma: PrismaClient;
}

export interface NormalizeS2Args {
  dealId: string;
  runId: string;
  output: S2Output;
}

/**
 * Persist S2 output:
 *   1. Create new Citations from output.new_citations, mapping tmp_ref → displayId.
 *   2. Rewrite [new_K] tags in each section body to [cN].
 *   3. Validate every [cN] / [rfN] in body resolves to a Citation / Finding row.
 *   4. Upsert Memo + 5 MemoSections.
 *   5. Append section_key to Citation.usedIn for every citation referenced.
 *
 * Throws on any unresolved tag — the orchestrator's S3 retry loop catches this.
 */
export async function normalizeS2(
  deps: NormalizeS2Deps,
  args: NormalizeS2Args,
): Promise<{ memoId: string; sectionIds: string[] }> {
  const { dealId, runId, output } = args;

  // 1. Insert new citations and build the tmp_ref → displayId map
  const tmpToDisplayId: Record<string, string> = {};
  const newCitationIds: string[] = [];
  for (const nc of output.new_citations) {
    const displayId = await nextDisplayId(deps.prisma, "c", dealId);
    const created = await deps.prisma.citation.create({
      data: {
        dealId,
        displayId,
        documentId: nc.doc_id,
        chunkId: nc.chunk_id,
        sectionRef: nc.section,
        page: nc.page ?? null,
        excerpt: nc.excerpt,
        confidence: nc.confidence,
        verified: false,
        usedIn: [],
      },
      select: { id: true },
    });
    tmpToDisplayId[nc.tmp_ref] = displayId;
    newCitationIds.push(created.id);
  }

  // 2. Build the known-IDs sets for validation
  const [allCitations, allFindings] = await Promise.all([
    deps.prisma.citation.findMany({
      where: { dealId },
      select: { id: true, displayId: true },
    }),
    deps.prisma.finding.findMany({
      where: { dealId },
      select: { id: true, displayId: true },
    }),
  ]);
  const citationByDisplayId = new Map(allCitations.map((c) => [c.displayId, c.id]));
  const findingDisplayIds = new Set(allFindings.map((f) => f.displayId));

  // 3. Rewrite tags + validate per section
  const finalSections = output.sections.map((s) => {
    let body = s.body;
    for (const [tmp, real] of Object.entries(tmpToDisplayId)) {
      body = replaceAll(body, `[${tmp}]`, `[${real}]`);
    }
    const cTags = Array.from(body.matchAll(/\[c(\d+)\]/g)).map((m) => `c${m[1]}`);
    const rTags = Array.from(body.matchAll(/\[rf(\d+)\]/g)).map((m) => `rf${m[1]}`);
    for (const t of cTags) {
      if (!citationByDisplayId.has(t)) {
        throw new Error(
          `S2 normalizer: section "${s.section_key}" references unknown citation ${t}`,
        );
      }
    }
    for (const t of rTags) {
      if (!findingDisplayIds.has(t)) {
        throw new Error(
          `S2 normalizer: section "${s.section_key}" references unknown red flag ${t}`,
        );
      }
    }
    return { ...s, body, _cTags: cTags };
  });

  // 4. Upsert Memo
  const memo = await deps.prisma.memo.upsert({
    where: { dealId },
    create: {
      dealId,
      runId,
      status: output.memo_status,
      reviewProgress: Number(output.review_progress.toFixed(2)),
      pendingItems: output.pending_items,
    },
    update: {
      runId,
      status: output.memo_status,
      reviewProgress: Number(output.review_progress.toFixed(2)),
      pendingItems: output.pending_items,
    },
    select: { id: true },
  });

  // 5. Upsert each MemoSection + connect cited citations
  const sectionIds: string[] = [];
  for (const s of finalSections) {
    const sectionKey = s.section_key as MemoSectionKey;
    const orderIdx = SECTION_ORDER.indexOf(sectionKey);
    const title = s.title?.trim() ? s.title : defaultSectionTitle(sectionKey);

    const citationConnects = s._cTags
      .map((displayId) => citationByDisplayId.get(displayId))
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ id }));

    const upserted = await deps.prisma.memoSection.upsert({
      where: { memoId_sectionKey: { memoId: memo.id, sectionKey } },
      create: {
        memoId: memo.id,
        sectionKey,
        title,
        body: s.body,
        reviewed: s.reviewed,
        orderIdx,
        citations: { connect: citationConnects },
      },
      update: {
        title,
        body: s.body,
        reviewed: s.reviewed,
        orderIdx,
        citations: { set: citationConnects },
      },
      select: { id: true },
    });
    sectionIds.push(upserted.id);

    // 5b. Append section_key to Citation.usedIn for each cited citation.
    for (const tag of s._cTags) {
      const citationId = citationByDisplayId.get(tag);
      if (!citationId) continue;
      const current = await deps.prisma.citation.findUnique({
        where: { id: citationId },
        select: { usedIn: true },
      });
      const next = current?.usedIn ?? [];
      if (!next.includes(sectionKey)) {
        await deps.prisma.citation.update({
          where: { id: citationId },
          data: { usedIn: [...next, sectionKey] },
        });
      }
    }
  }

  return { memoId: memo.id, sectionIds };
}

function replaceAll(haystack: string, needle: string, replacement: string): string {
  // Plain-string replaceAll (Node 16+ has String.prototype.replaceAll, but
  // keeping this explicit for clarity in the normalizer hot path).
  return haystack.split(needle).join(replacement);
}
