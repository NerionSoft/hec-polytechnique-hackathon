import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { handleError, ok, badRequest, notFound } from "@/src/infrastructure/http/apiResult";
import { nextDisplayId } from "@/src/application/agents/shared/displayId";
import { loadFindingForOwner } from "../../_lib/loadFinding";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    body: z.string().trim().min(1).max(2000).optional(),
  })
  .optional();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { findingId } = await params;

    const json = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(json ?? {});
    if (!parsed.success) return badRequest("Invalid input", parsed.error.issues);

    const finding = await loadFindingForOwner(findingId, session.user.id);
    if (!finding) return notFound("Finding not found");

    const body = parsed.data?.body?.trim() ?? finding.suggestedQuestion?.trim() ?? null;
    if (!body) {
      return badRequest("No question body — provide one or set suggestedQuestion on the finding");
    }

    const existing = await prisma.managementQuestion.findFirst({
      where: { dealId: finding.dealId, derivedFromFindingId: finding.id },
      select: { id: true, displayId: true },
    });
    if (existing) return ok({ id: existing.id, displayId: existing.displayId, reused: true });

    const displayId = await nextDisplayId(prisma, "q", finding.dealId);
    const question = await prisma.managementQuestion.create({
      data: {
        displayId,
        dealId: finding.dealId,
        runId: finding.runId,
        topic: finding.category,
        body,
        derivedFromFindingId: finding.id,
        raisedBy: session.user.id,
      },
      select: { id: true, displayId: true },
    });

    await prisma.dealAuditEvent.create({
      data: {
        dealId: finding.dealId,
        actorId: session.user.id,
        kind: "finding.added_to_question",
        entity: finding.displayId,
        payload: { questionDisplayId: question.displayId },
      },
    });

    return ok(question);
  } catch (error) {
    return handleError(error);
  }
}
