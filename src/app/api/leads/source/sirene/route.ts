import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { handleError, ok, badRequest } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

const BodySchema = z.object({
  thesisId: z.string().optional(),
  pages: z.number().int().min(1).max(10).optional(),
  query: z.object({
    sectors: z.array(z.string()).optional(),
    sections: z.array(z.string()).optional(),
    postalCodes: z.array(z.string()).optional(),
    departements: z.array(z.string()).optional(),
    employeeBracketCodes: z.array(z.string()).optional(),
    legalFormCodes: z.array(z.string()).optional(),
    page: z.number().int().min(1).max(100).optional(),
    perPage: z.number().int().min(1).max(25).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request.headers);
    const json = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid body", parsed.error.issues);
    }
    const result = await getUseCases().fetchLeadsFromSirene({
      ownerId: session.user.id,
      thesisId: parsed.data.thesisId,
      query: parsed.data.query,
      pages: parsed.data.pages,
    });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
