import Link from "next/link";
import { ArrowRight, Plus, Radar } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { leadSources, leads } from "@/src/lib/mock/leads";
import { PageHeader } from "../_components/PageHeader";
import { formatRelativeDate } from "@/src/lib/utils";

export default function SourcesPage() {
  const newToday = leadSources.reduce((s, src) => s + src.newToday, 0);

  return (
    <>
      <PageHeader
        title="Lead Sources"
        description={`${newToday} new leads today across ${leadSources.filter((s) => s.active).length} active sources`}
        action={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full",
              "border-foreground/[0.10] border px-3 py-1.5",
              "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground text-[12px]",
            )}
          >
            <Plus strokeWidth={1.8} className="size-3.5" />
            Configure source
          </button>
        }
      />

      <div className="border-foreground/[0.08] bg-foreground/[0.02] mx-8 mb-6 overflow-hidden rounded-[20px] border">
        <div
          className={cn(
            "border-foreground/[0.08] flex items-center justify-between border-b px-5 py-2.5",
          )}
        >
          <div className="text-foreground/45 flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase">
            <Radar strokeWidth={1.6} className="size-3" />
            This week
          </div>
        </div>
        <div className="divide-foreground/[0.08] grid grid-cols-2 sm:grid-cols-4 sm:divide-x">
          <Stat label="New leads" value="44" />
          <Stat label="Qualified" value="18" />
          <Stat label="Promoted to deal" value="6" />
          <Stat label="Sources active" value={`${leadSources.filter((s) => s.active).length}`} />
        </div>
      </div>

      <div className="mx-8 mb-4 flex flex-wrap items-center gap-2">
        {leadSources.map((src) => (
          <span
            key={src.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
              "text-[11.5px]",
              src.active
                ? "border-foreground/[0.10] bg-foreground/[0.02] text-foreground/75"
                : "border-foreground/[0.06] bg-foreground/[0.01] text-foreground/35 line-through",
            )}
          >
            {src.name}
            {src.active && (
              <span className="bg-warm/15 tabular text-warm rounded-full px-1.5 py-px text-[9.5px]">
                +{src.newToday}
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="border-foreground/[0.08] bg-surface/40 mx-8 mb-12 overflow-hidden rounded-[18px] border">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-foreground/[0.08] text-foreground/45 border-b text-left text-[10.5px] tracking-[0.14em] uppercase">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Sector</th>
              <th className="px-4 py-2.5 font-medium">Geo</th>
              <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
              <th className="px-4 py-2.5 text-right font-medium">Growth</th>
              <th className="px-4 py-2.5 text-right font-medium">Score</th>
              <th className="px-4 py-2.5 font-medium">Source</th>
              <th className="px-4 py-2.5 text-right font-medium">Ingested</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="group border-foreground/[0.04] hover:bg-foreground/[0.02] border-b last:border-0"
              >
                <td className="text-foreground px-4 py-3 font-medium">
                  {lead.flag} {lead.name}
                </td>
                <td className="text-foreground/65 px-4 py-3">{lead.sector}</td>
                <td className="text-foreground/55 px-4 py-3">{lead.geo}</td>
                <td className="tabular text-foreground/85 px-4 py-3 text-right">
                  €{lead.revenue.toFixed(1)}M
                </td>
                <td
                  className={cn(
                    "tabular px-4 py-3 text-right",
                    lead.growth >= 0.4 ? "text-sev-low" : "text-foreground/65",
                  )}
                >
                  +{(lead.growth * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-right">
                  <ScorePill score={lead.score} />
                </td>
                <td className="text-foreground/65 px-4 py-3">{lead.source}</td>
                <td className="tabular text-foreground/45 px-4 py-3 text-right">
                  {formatRelativeDate(lead.ingestedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/sources/${lead.id}`}
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
      <p className="tabular font-serif text-[26px] leading-none tracking-tight">{value}</p>
    </div>
  );
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-foreground/30">—</span>;
  const tone =
    score >= 80
      ? "bg-sev-low/15 text-sev-low"
      : score >= 65
        ? "bg-sev-med/15 text-sev-med"
        : "bg-sev-crit/15 text-sev-crit";
  return (
    <span
      className={cn(
        "inline-block min-w-[44px] rounded-full px-2 py-0.5",
        "tabular text-center text-[11.5px] font-medium",
        tone,
      )}
    >
      {score}
    </span>
  );
}
