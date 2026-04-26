import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { setSelectedThesisCookie } from "@/src/infrastructure/http/selectedThesis";
import { handleError, ok, badRequest, notFound } from "@/src/infrastructure/http/apiResult";

export const runtime = "nodejs";

const BodySchema = z.object({ thesisId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request.headers);
    const json = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return badRequest("Invalid body", parsed.error.issues);
    const t = await getUseCases().getThesisById({
      ownerId: session.user.id,
      id: parsed.data.thesisId,
    });
    if (!t) return notFound(`Thesis ${parsed.data.thesisId} not found`);
    await setSelectedThesisCookie(t.id);
    return ok({ selectedThesisId: t.id });
  } catch (error) {
    return handleError(error);
  }
}
