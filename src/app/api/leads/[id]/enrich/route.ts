import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";
import type { LeadId } from "@/src/application/domain/lead/Lead";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    forceRescrape: z.boolean().optional(),
    forceReenrich: z.boolean().optional(),
  })
  .optional();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid body", parsed.error.issues);
    }

    const result = await getUseCases().enrichLead({
      ownerId: session.user.id,
      leadId: id as LeadId,
      forceRescrape: parsed.data?.forceRescrape,
      forceReenrich: parsed.data?.forceReenrich,
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
