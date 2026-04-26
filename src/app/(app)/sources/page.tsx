import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { getSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { getSelectedThesisId } from "@/src/infrastructure/http/selectedThesis";
import { ScorePill } from "@/src/presentation/components/leads/DecisionPill";
import { MethodologyDrawer } from "@/src/presentation/components/methodology/MethodologyDrawer";
import { LEAD_STATUS } from "@/src/application/domain/lead/enums";
import { getCountry } from "@/src/application/reference/countries";
import { PageHeader } from "../_components/PageHeader";
import { SireneFetchPanel } from "./_components/SireneFetchPanel";
import { CsvImportPanel } from "./_components/CsvImportPanel";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/sign-in");

  const useCases = getUseCases();
  const selectedThesisId = await getSelectedThesisId(session.user.id);

  const allTheses = await useCases.listTheses(session.user.id);
  const selectedThesis = allTheses.find((t) => t.id === selectedThesisId && t.active) ?? null;

  const leads = selectedThesisId
    ? await useCases.listLeads({
        ownerId: session.user.id,
        thesisId: selectedThesisId,
        limit: 200,
      })
    : [];

  const ids = leads.map((l) => l.id);
  const [enrichments, scores] = await Promise.all([
    useCases.enrichmentRepo.findByLeadIds(ids),
    useCases.scoreRepo.findByLeadIds(ids),
  ]);

  const ENRICHED_STATUSES = new Set<string>([
    LEAD_STATUS.ENRICHED,
    LEAD_STATUS.SCORED,
    LEAD_STATUS.QUALIFIED,
    LEAD_STATUS.CONTACTED,
  ]);
  const SCORED_STATUSES = new Set<string>([
    LEAD_STATUS.SCORED,
    LEAD_STATUS.QUALIFIED,
    LEAD_STATUS.CONTACTED,
  ]);
  const counts = {
    total: leads.length,
    enriched: leads.filter((l) => ENRICHED_STATUSES.has(l.status)).length,
    scored: leads.filter((l) => SCORED_STATUSES.has(l.status)).length,
    contacted: leads.filter((l) => l.status === LEAD_STATUS.CONTACTED).length,
  };

  return (
    <>
      <PageHeader
        title="Sources"
        description={
          selectedThesis
            ? `Leads for thesis "${selectedThesis.name}". Sources: Sirene (INSEE), CSV import.`
            : "No active thesis selected. Create or activate a thesis from the switcher in the top-right."
        }
        action={<MethodologyDrawer />}
      />

      <div className="divide-foreground/[0.08] border-foreground/[0.08] bg-foreground/[0.02] mx-4 mb-6 grid grid-cols-2 overflow-hidden rounded-[18px] border sm:mx-8 sm:grid-cols-4 sm:divide-x">
        <Stat label="Leads" value={counts.total} />
        <Stat label="Enriched" value={counts.enriched} />
        <Stat label="Scored" value={counts.scored} />
        <Stat label="Contacted" value={counts.contacted} />
      </div>

      {selectedThesis && (
        <details
          className={cn(
            "border-foreground/[0.08] bg-foreground/[0.02] mx-4 mb-6 rounded-[16px] border sm:mx-8",
            "[&_summary::-webkit-details-marker]:hidden",
          )}
          open={leads.length === 0}
        >
          <summary
            className={cn(
              "flex cursor-pointer items-center justify-between px-5 py-3",
              "text-foreground/75 hover:text-foreground text-[12.5px]",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
                Add leads
              </span>
              <span className="text-foreground/65">· Sirene API · CSV import</span>
            </span>
            <span className="text-foreground/45 text-[10.5px]">click to expand</span>
          </summary>
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[2fr_1fr]">
            <SireneFetchPanel
              selectedThesisId={selectedThesisId}
              defaultSectors={selectedThesis.sectors}
            />
            <CsvImportPanel selectedThesisId={selectedThesisId} />
          </div>
        </details>
      )}

      <div className="border-foreground/[0.08] bg-surface/40 mx-4 mb-12 overflow-hidden rounded-[18px] border sm:mx-8">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <p className="text-foreground/65 text-[13px]">
              {selectedThesis
                ? "No leads yet. Use the Sirene panel above to import companies."
                : "Select an active thesis to start sourcing leads."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead>
                <tr className="border-foreground/[0.08] text-foreground/45 border-b text-left text-[10.5px] tracking-[0.14em] uppercase">
                  <th className="px-4 py-2.5 font-medium">Company</th>
                  <th className="px-4 py-2.5 font-medium">Sector / NAF</th>
                  <th className="px-4 py-2.5 font-medium">Country</th>
                  <th className="px-4 py-2.5 text-right font-medium">Employees</th>
                  <th className="px-4 py-2.5 text-right font-medium">Revenue €</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Score</th>
                  <th className="px-4 py-2.5 font-medium">Source</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const j = lead.toJSON();
                  const e = enrichments.get(j.id);
                  const s = scores.get(j.id);
                  const country = getCountry(j.country);
                  return (
                    <tr
                      key={j.id}
                      className="group border-foreground/[0.04] hover:bg-foreground/[0.02] border-b last:border-0"
                    >
                      <td className="text-foreground px-4 py-3 font-medium">{j.companyName}</td>
                      <td className="text-foreground/65 px-4 py-3">
                        <span className="tabular text-foreground/45">{j.napCode ?? "—"}</span>{" "}
                        {j.sector ?? ""}
                      </td>
                      <td className="text-foreground/65 px-4 py-3">
                        {country ? `${country.code} · ${country.label}` : j.country}
                      </td>
                      <td className="tabular text-foreground/85 px-4 py-3 text-right">
                        {j.employeeCount ?? "—"}
                      </td>
                      <td className="tabular text-foreground/85 px-4 py-3 text-right">
                        {j.estimatedRevenueEur != null
                          ? `${(j.estimatedRevenueEur / 1_000_000).toFixed(1)}M`
                          : "—"}
                      </td>
                      <td className="text-foreground/65 px-4 py-3">
                        <StatusPill status={j.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScorePill score={s?.score ?? null} decision={s?.decision ?? null} />
                        {e && !s && (
                          <span className="text-foreground/45 ml-1 text-[10px]">
                            (LLM {e.peFitScore})
                          </span>
                        )}
                      </td>
                      <td className="text-foreground/55 px-4 py-3 text-[10.5px] tracking-[0.10em] uppercase">
                        {j.source}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/sources/${j.id}`}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1",
                            "text-foreground/55 text-[11.5px]",
                            "group-hover:text-foreground transition-colors",
                          )}
                        >
                          Detail
                          <ArrowRight strokeWidth={1.6} className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
      <p className="tabular font-serif text-[26px] leading-none tracking-tight">{value}</p>
    </div>
  );
}

function WebsiteCell({ url, autoSource }: { url: string | null; autoSource: string | null }) {
  if (!url) return <span className="text-foreground/35">—</span>;
  const display = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-foreground/85 inline-flex max-w-[180px] items-center gap-0.5 truncate underline-offset-2 hover:underline"
      >
        <span className="truncate">{display}</span>
        <ExternalLink strokeWidth={1.6} className="size-3 shrink-0" />
      </a>
      {autoSource && (
        <span
          className={cn(
            "bg-foreground/[0.08] text-foreground/65",
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] tracking-[0.10em] uppercase",
          )}
          title={`Auto-discovered via ${autoSource}`}
        >
          <Sparkles strokeWidth={1.6} className="size-2.5" />
          auto
        </span>
      )}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "bg-foreground/[0.06] rounded-full px-2 py-0.5",
        "text-foreground/65 text-[10.5px] tracking-[0.10em] uppercase",
      )}
    >
      {status.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}
