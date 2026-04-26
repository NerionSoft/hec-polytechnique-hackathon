import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { handleError, ok, badRequest, notFound } from "@/src/infrastructure/http/apiResult";
import { loadFindingForOwner } from "../_lib/loadFinding";

export const runtime = "nodejs";

const PatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  summary: z.string().trim().max(2000).optional().nullable(),
  detail: z.string().trim().max(8000).optional().nullable(),
  suggestedQuestion: z.string().trim().max(2000).optional().nullable(),
  impact: z.string().trim().max(2000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { findingId } = await params;

    const json = await request.json().catch(() => null);
    if (!json) return badRequest("Invalid JSON body");
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.issues);
    if (Object.keys(parsed.data).length === 0) return badRequest("No fields to update");

    const finding = await loadFindingForOwner(findingId, session.user.id);
    if (!finding) return notFound("Finding not found");

    const updated = await prisma.finding.update({
      where: { id: findingId },
      data: parsed.data,
      select: {
        id: true,
        displayId: true,
        title: true,
        summary: true,
        detail: true,
        suggestedQuestion: true,
        impact: true,
      },
    });

    await prisma.dealAuditEvent.create({
      data: {
        dealId: finding.dealId,
        actorId: session.user.id,
        kind: "finding.edited",
        entity: finding.displayId,
        payload: { fields: Object.keys(parsed.data) },
      },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
