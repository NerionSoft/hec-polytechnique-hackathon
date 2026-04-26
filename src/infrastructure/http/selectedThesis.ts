import { cookies } from "next/headers";
import { getUseCases } from "@/src/infrastructure/composition";

const COOKIE_NAME = "athena_thesis_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getSelectedThesisId(ownerId: string): Promise<string | null> {
  const jar = await cookies();
  const cookieId = jar.get(COOKIE_NAME)?.value ?? null;
  const useCases = getUseCases();

  if (cookieId) {
    const t = await useCases.getThesisById({ ownerId, id: cookieId });
    if (t && t.active) return t.id;
  }

  // Fallback: first active thesis (most recently updated)
  const all = await useCases.listTheses(ownerId);
  const active = all.filter((t) => t.active);
  if (active.length === 0) return null;
  active.sort((a, b) => b.toJSON().updatedAt.getTime() - a.toJSON().updatedAt.getTime());
  return active[0]!.id;
}

export async function setSelectedThesisCookie(thesisId: string): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: thesisId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSelectedThesisCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
