import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, notFound } from "@/src/infrastructure/http/apiResult";
import type { LeadId } from "@/src/application/domain/lead/Lead";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSession(request.headers);
    const { id } = await context.params;
    const useCases = getUseCases();
    const leadId = id as LeadId;
    const [lead, enrichment, score] = await Promise.all([
      useCases.getLeadById(leadId),
      useCases.enrichmentRepo.findByLeadId(leadId),
      useCases.scoreRepo.findByLeadId(leadId),
    ]);
    if (!lead) return notFound(`Lead ${id} not found`);
    return ok({
      lead: lead.toJSON(),
      enrichment,
      score,
    });
  } catch (error) {
    return handleError(error);
  }
}
