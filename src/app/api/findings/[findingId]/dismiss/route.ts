import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { handleError, ok, notFound } from "@/src/infrastructure/http/apiResult";
import { loadFindingForOwner } from "../../_lib/loadFinding";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { findingId } = await params;

    const finding = await loadFindingForOwner(findingId, session.user.id);
    if (!finding) return notFound("Finding not found");

    const updated = await prisma.finding.update({
      where: { id: findingId },
      data: {
        status: "DISMISSED",
        approvedById: null,
        approvedAt: null,
      },
      select: { id: true, displayId: true, status: true },
    });

    await prisma.dealAuditEvent.create({
      data: {
        dealId: finding.dealId,
        actorId: session.user.id,
        kind: "finding.dismissed",
        entity: finding.displayId,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
