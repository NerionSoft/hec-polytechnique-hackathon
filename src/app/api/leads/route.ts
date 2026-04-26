import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";
import { LEAD_STATUS } from "@/src/application/domain/lead/enums";
import type { LeadId } from "@/src/application/domain/lead/Lead";

export const runtime = "nodejs";

const QuerySchema = z.object({
  status: z.enum(LEAD_STATUS).optional(),
  thesisId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request.headers);
    const parsed = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) {
      return badRequest("Invalid query", parsed.error.issues);
    }
    const useCases = getUseCases();
    const leads = await useCases.listLeads({ ownerId: session.user.id, ...parsed.data });

    const ids = leads.map((l) => l.id) as LeadId[];
    const [enrichments, scores] = await Promise.all([
      useCases.enrichmentRepo.findByLeadIds(ids),
      useCases.scoreRepo.findByLeadIds(ids),
    ]);

    const items = leads.map((lead) => {
      const e = enrichments.get(lead.id);
      const s = scores.get(lead.id);
      return {
        ...lead.toJSON(),
        enrichment: e
          ? {
              businessSummary: e.businessSummary,
              peFitScore: e.peFitScore,
              peFitDecision: e.peFitDecision,
              concernsCount: e.concerns.length,
              rationaleCount: e.investmentRationale.length,
              missingInfoCount: e.missingInfo.length,
              model: e.model,
              updatedAt: e.updatedAt,
            }
          : null,
        score: s
          ? {
              score: s.score,
              decision: s.decision,
              thesisId: s.thesisId,
              reasonsCount: s.reasons.length,
              updatedAt: s.updatedAt,
            }
          : null,
      };
    });

    return ok({ leads: items });
  } catch (error) {
    return handleError(error);
  }
}
