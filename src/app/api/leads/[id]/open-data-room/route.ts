import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest, notFound } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id: leadId } = await params;
    const useCases = getUseCases();
    const { prisma } = useCases;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { deal: true, thesis: true },
    });

    if (!lead) return notFound("Lead not found");
    if (!lead.thesis || lead.thesis.ownerId !== session.user.id) {
      return notFound("Lead not found");
    }

    // If a Deal already exists, just return its id (idempotent).
    if (lead.deal) {
      return ok({ dealId: lead.deal.id, alreadyExisted: true });
    }

    const result = await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          leadId: lead.id,
          ownerId: session.user.id,
          thesisId: lead.thesisId,
          stage: "IN_DD",
          revenueEur: lead.estimatedRevenue ?? undefined,
          employees: lead.employeeCount ?? undefined,
          nextAction: "Upload data room documents",
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: { status: "DATA_ROOM_OPENED" },
      });

      await tx.dealAuditEvent.create({
        data: {
          dealId: deal.id,
          actorId: session.user.id,
          kind: "deal.opened",
          entity: lead.id,
          payload: { fromLeadStatus: lead.status, leadCompanyName: lead.companyName },
        },
      });

      return deal;
    });

    return ok({ dealId: result.id, alreadyExisted: false }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return badRequest("A deal already exists for this lead");
    }
    return handleError(error);
  }
}
