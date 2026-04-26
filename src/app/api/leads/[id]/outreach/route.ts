import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";
import type { LeadId } from "@/src/application/domain/lead/Lead";

export const runtime = "nodejs";

const PostBodySchema = z.object({
  thesisId: z.string().min(1),
  recipient: z.string().email().nullable().optional(),
  fund: z
    .object({
      senderName: z.string().nullable().optional(),
      fundName: z.string().nullable().optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id } = await context.params;
    const drafts = await getUseCases().listOutreachDrafts({
      ownerId: session.user.id,
      leadId: id as LeadId,
    });
    return ok({ drafts: drafts.map((d) => d.toJSON()) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = PostBodySchema.safeParse(json);
    if (!parsed.success) return badRequest("Invalid body", parsed.error.issues);
    const draft = await getUseCases().generateOutreachDraft({
      ownerId: session.user.id,
      leadId: id as LeadId,
      thesisId: parsed.data.thesisId,
      recipient: parsed.data.recipient ?? null,
      fund: parsed.data.fund
        ? {
            senderName: parsed.data.fund.senderName ?? null,
            fundName: parsed.data.fund.fundName ?? null,
          }
        : undefined,
    });
    return ok({ draft: draft.toJSON() }, 201);
  } catch (error) {
    return handleError(error);
  }
}
