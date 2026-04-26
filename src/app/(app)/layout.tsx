import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { getSelectedThesisId } from "@/src/infrastructure/http/selectedThesis";
import { Sidebar } from "./_components/Sidebar";
import { Topbar } from "./_components/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(await headers());
  if (!session) redirect("/sign-in");

  const theses = await getUseCases().listTheses(session.user.id);
  const selectedThesisId = await getSelectedThesisId(session.user.id);

  const summaries = theses.filter((t) => t.active).map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <div className="md:pl-[240px]">
        <Topbar
          theses={summaries}
          selectedThesisId={selectedThesisId}
          user={{ email: session.user.email, name: session.user.name ?? null }}
        />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </div>
    </div>
  );
}
