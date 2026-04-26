import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest, notFound } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

const BodySchema = z.discriminatedUnion("to", [
  z.object({ to: z.literal("IC_READY") }),
  z.object({
    to: z.literal("DECIDED"),
    decision: z.enum(["PASSED", "REJECTED"]),
    nextAction: z.string().optional(),
  }),
  z.object({ to: z.literal("IN_DD") }),
]);

const ALLOWED_FORWARD_TRANSITIONS: Record<string, string[]> = {
  IN_DD: ["IC_READY"],
  IC_READY: ["DECIDED", "IN_DD"],
  DECIDED: [],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { dealId } = await params;

    const json = await request.json().catch(() => null);
    if (!json) return badRequest("Invalid JSON body");
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.issues);
    const body = parsed.data;

    const { prisma } = getUseCases();
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, ownerId: true, stage: true, decision: true },
    });
    if (!deal) return notFound("Deal not found");
    if (deal.ownerId !== session.user.id) return notFound("Deal not found");

    const allowed = ALLOWED_FORWARD_TRANSITIONS[deal.stage] ?? [];
    if (!allowed.includes(body.to)) {
      return badRequest(
        `Cannot transition from ${deal.stage} to ${body.to}. Allowed: ${allowed.join(", ") || "none"}.`,
      );
    }

    const update: { stage: typeof body.to; decision?: "PASSED" | "REJECTED"; nextAction?: string } =
      {
        stage: body.to,
      };
    if (body.to === "DECIDED") {
      update.decision = body.decision;
      update.nextAction =
        body.nextAction ?? (body.decision === "PASSED" ? "Term sheet outstanding" : "Passed");
    } else if (body.to === "IC_READY") {
      update.nextAction = "Awaiting IC vote";
    } else if (body.to === "IN_DD") {
      update.nextAction = "Resume diligence";
    }

    await prisma.$transaction([
      prisma.deal.update({ where: { id: dealId }, data: update }),
      prisma.dealAuditEvent.create({
        data: {
          dealId,
          actorId: session.user.id,
          kind:
            body.to === "DECIDED"
              ? `deal.decided.${body.decision.toLowerCase()}`
              : `deal.advanced.${body.to.toLowerCase()}`,
          payload: { from: deal.stage, to: body.to },
        },
      }),
    ]);

    return ok({ id: dealId, stage: body.to });
  } catch (error) {
    return handleError(error);
  }
}
