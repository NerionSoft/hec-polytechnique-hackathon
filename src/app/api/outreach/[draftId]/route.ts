import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

const PatchBodySchema = z
  .object({
    subject: z.string().min(1).max(200).optional(),
    body: z.string().min(1).max(5000).optional(),
    recipient: z.string().email().nullable().optional(),
    action: z.enum(["approve", "markSent"]).optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: "Patch body must not be empty" });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> },
) {
  try {
    const session = await requireSession(request.headers);
    const { draftId } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = PatchBodySchema.safeParse(json);
    if (!parsed.success) return badRequest("Invalid body", parsed.error.issues);

    const useCases = getUseCases();
    const ownerId = session.user.id;

    if (parsed.data.action === "markSent") {
      const updated = await useCases.markOutreachSent({ ownerId, draftId });
      return ok({ draft: updated.toJSON() });
    }
    if (parsed.data.action === "approve") {
      const updated = await useCases.approveOutreachDraft({ ownerId, draftId });
      return ok({ draft: updated.toJSON() });
    }

    const updated = await useCases.updateOutreachDraft({
      ownerId,
      draftId,
      patch: {
        subject: parsed.data.subject,
        body: parsed.data.body,
        recipient: parsed.data.recipient ?? undefined,
      },
    });
    return ok({ draft: updated.toJSON() });
  } catch (error) {
    return handleError(error);
  }
}
