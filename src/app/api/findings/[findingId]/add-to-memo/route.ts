import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { handleError, ok, notFound } from "@/src/infrastructure/http/apiResult";
import { loadFindingForOwner } from "../../_lib/loadFinding";

export const runtime = "nodejs";

const RISK_SECTION_ORDER_BASE = 10000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { findingId } = await params;

    const finding = await loadFindingForOwner(findingId, session.user.id);
    if (!finding) return notFound("Finding not found");

    const memo = await prisma.memo.upsert({
      where: { dealId: finding.dealId },
      create: {
        dealId: finding.dealId,
        runId: finding.runId,
        status: "DRAFT",
      },
      update: {},
      select: { id: true },
    });

    const sectionKey = `risk-${finding.displayId}`;
    const existingCount = await prisma.memoSection.count({
      where: { memoId: memo.id, sectionKey: { startsWith: "risk-" } },
    });
    const orderIdx = RISK_SECTION_ORDER_BASE + existingCount;

    const title = `Risk · ${finding.displayId.toUpperCase()} — ${finding.title}`;
    const body = [
      finding.summary?.trim() ?? "",
      finding.detail?.trim() ?? "",
      finding.impact ? `Impact: ${finding.impact.trim()}` : "",
      finding.suggestedQuestion ? `Mgmt Q: ${finding.suggestedQuestion.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const citationConnects = finding.primaryCitationId
      ? { connect: [{ id: finding.primaryCitationId }] }
      : undefined;

    const section = await prisma.memoSection.upsert({
      where: { memoId_sectionKey: { memoId: memo.id, sectionKey } },
      create: {
        memoId: memo.id,
        sectionKey,
        title,
        body,
        reviewed: false,
        orderIdx,
        ...(citationConnects ? { citations: citationConnects } : {}),
      },
      update: {
        title,
        body,
        ...(citationConnects ? { citations: { set: [{ id: finding.primaryCitationId! }] } } : {}),
      },
      select: { id: true, sectionKey: true },
    });

    await prisma.dealAuditEvent.create({
      data: {
        dealId: finding.dealId,
        actorId: session.user.id,
        kind: "finding.added_to_memo",
        entity: finding.displayId,
        payload: { sectionKey: section.sectionKey },
      },
    });

    return ok(section);
  } catch (error) {
    return handleError(error);
  }
}
