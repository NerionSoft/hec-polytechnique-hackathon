import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";
import type { LeadId } from "@/src/application/domain/lead/Lead";

export const runtime = "nodejs";

const BodySchema = z.object({
  thesisId: z.string(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid body", parsed.error.issues);
    }
    const score = await getUseCases().scoreLead({
      ownerId: session.user.id,
      leadId: id as LeadId,
      thesisId: parsed.data.thesisId,
    });
    return ok(score);
  } catch (error) {
    return handleError(error);
  }
}
