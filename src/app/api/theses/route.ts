import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

const PreferencesSchema = z.object({
  founderOwned: z.boolean().optional(),
  recurringRevenue: z.boolean().optional(),
  profitable: z.boolean().optional(),
  fragmentedMarket: z.boolean().optional(),
  successionRisk: z.boolean().optional(),
  lowCompetition: z.boolean().optional(),
});

const CreateBodySchema = z.object({
  name: z.string().min(1).max(120),
  sectors: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  minRevenueEur: z.number().nonnegative().nullable().optional(),
  maxRevenueEur: z.number().nonnegative().nullable().optional(),
  preferences: PreferencesSchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request.headers);
    const theses = await getUseCases().listTheses(session.user.id);
    return ok({ theses: theses.map((t) => t.toJSON()) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request.headers);
    const json = await request.json().catch(() => null);
    const parsed = CreateBodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid body", parsed.error.issues);
    }
    const thesis = await getUseCases().createThesis({
      ownerId: session.user.id,
      ...parsed.data,
    });
    return ok({ thesis: thesis.toJSON() }, 201);
  } catch (error) {
    return handleError(error);
  }
}
