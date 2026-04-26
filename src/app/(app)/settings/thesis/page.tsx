import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { getSelectedThesisId } from "@/src/infrastructure/http/selectedThesis";
import { ThesisManager, type ThesisDto } from "@/src/presentation/components/thesis/ThesisManager";

export const dynamic = "force-dynamic";

export default async function ThesisSettingsPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/sign-in");

  const theses = await getUseCases().listTheses(session.user.id);
  const selectedId = await getSelectedThesisId(session.user.id);

  const dtos: ThesisDto[] = theses.map((t) => {
    const j = t.toJSON();
    return {
      id: j.id,
      ownerId: j.ownerId,
      name: j.name,
      sectors: j.sectors,
      countries: j.countries,
      minRevenueEur: j.minRevenueEur,
      maxRevenueEur: j.maxRevenueEur,
      preferences: j.preferences,
      active: j.active,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    };
  });

  return <ThesisManager initialTheses={dtos} initialSelectedId={selectedId} />;
}
