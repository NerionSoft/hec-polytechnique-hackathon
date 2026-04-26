import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, notFound, badRequest } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

const PreferencesSchema = z.object({
  founderOwned: z.boolean().optional(),
  recurringRevenue: z.boolean().optional(),
  profitable: z.boolean().optional(),
  fragmentedMarket: z.boolean().optional(),
  successionRisk: z.boolean().optional(),
  lowCompetition: z.boolean().optional(),
});

const PatchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    sectors: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    minRevenueEur: z.number().nonnegative().nullable().optional(),
    maxRevenueEur: z.number().nonnegative().nullable().optional(),
    preferences: PreferencesSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: "Patch body must not be empty" });

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id } = await context.params;
    const thesis = await getUseCases().getThesisById({ ownerId: session.user.id, id });
    if (!thesis) return notFound(`Thesis ${id} not found`);
    return ok({ thesis: thesis.toJSON() });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = PatchBodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid body", parsed.error.issues);
    }
    const updated = await getUseCases().updateThesis({
      ownerId: session.user.id,
      id,
      patch: parsed.data,
    });
    return ok({ thesis: updated.toJSON() });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request.headers);
    const { id } = await context.params;
    await getUseCases().deleteThesis({ ownerId: session.user.id, id });
    return ok({ deactivated: true });
  } catch (error) {
    return handleError(error);
  }
}
