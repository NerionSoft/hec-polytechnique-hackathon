import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { getSelectedThesisId } from "@/src/infrastructure/http/selectedThesis";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

const BodySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  country: z
    .string()
    .trim()
    .length(2, "Country must be a 2-letter ISO code")
    .toUpperCase()
    .default("FR"),
  sector: z.string().trim().max(120).optional().nullable(),
  website: z.string().trim().url().optional().nullable(),
  founderName: z.string().trim().max(200).optional().nullable(),
  estimatedRevenueEur: z.number().nonnegative().optional().nullable(),
  employeeCount: z.number().int().nonnegative().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request.headers);

    const json = await request.json().catch(() => null);
    if (!json) return badRequest("Invalid JSON body");
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.issues);
    }
    const data = parsed.data;

    const thesisId = await getSelectedThesisId(session.user.id);
    if (!thesisId) {
      return badRequest("Configure a fund thesis before creating a deal.");
    }

    const useCases = getUseCases();
    const { prisma } = useCases;

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          source: "MANUAL",
          companyName: data.companyName,
          country: data.country,
          sector: data.sector ?? null,
          website: data.website ?? null,
          founderName: data.founderName ?? null,
          estimatedRevenue: data.estimatedRevenueEur ?? null,
          employeeCount: data.employeeCount ?? null,
          status: "DATA_ROOM_OPENED",
          thesisId,
        },
      });

      const deal = await tx.deal.create({
        data: {
          leadId: lead.id,
          ownerId: session.user.id,
          thesisId,
          stage: "IN_DD",
          revenueEur: data.estimatedRevenueEur ?? null,
          employees: data.employeeCount ?? null,
          nextAction: "Upload data room documents",
        },
      });

      await tx.dealAuditEvent.create({
        data: {
          dealId: deal.id,
          actorId: session.user.id,
          kind: "deal.created_manual",
          entity: lead.id,
          payload: { companyName: data.companyName, country: data.country },
        },
      });

      return { leadId: lead.id, dealId: deal.id };
    });

    return ok(result, 201);
  } catch (error) {
    return handleError(error);
  }
}
