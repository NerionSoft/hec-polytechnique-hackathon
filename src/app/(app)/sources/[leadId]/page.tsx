import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { getLead, scoreBreakdown } from "@/src/lib/mock/leads";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const lead = getLead(leadId);
  if (!lead) notFound();

  const breakdown = scoreBreakdown(lead);
  const total = breakdown.reduce((sum, b) => sum + b.score, 0);

  return (
    <div className="px-8 pb-12">
      <div className="pt-6">
        <Link
          href="/sources"
          className={cn(
            "inline-flex items-center gap-1 text-[12px] text-foreground/55",
            "transition-colors hover:text-foreground",
          )}
        >
          <ChevronLeft strokeWidth={1.6} className="size-3.5" />
          Sources
        </Link>
      </div>

      <div className="mt-3 flex items-start justify-between gap-6 pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[34px] leading-[1.05] tracking-tight">
            {lead.flag} {lead.name}
          </h1>
          <p className="mt-1 text-[13px] text-foreground/55">
            {countryName(lead.geo)} · {lead.sector} · Founded {lead.founded} ·{" "}
            {lead.headcount} employees
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2",
            "text-[12px] font-medium text-background hover:opacity-90",
          )}
        >
          <Sparkles strokeWidth={1.8} className="size-3.5" />
          Promote to deal
          <ArrowRight strokeWidth={1.8} className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section
          className={cn(
            "rounded-[20px] border border-foreground/[0.08] bg-surface/60 p-6",
          )}
        >
          <div className="mb-5 flex items-baseline justify-between">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
              Thesis fit
            </p>
            <p className="tabular font-serif text-[44px] leading-none tracking-tight">
              {total} <span className="text-[16px] text-foreground/45">/ 100</span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {breakdown.map((row) => (
              <BreakdownRow key={row.axis} row={row} />
            ))}
          </div>

          <p className="mt-5 border-t border-foreground/[0.06] pt-4 text-[12.5px] leading-relaxed text-foreground/65">
            <span className="font-medium text-foreground">Why this matters: </span>
            Matches Athena Fund III thesis on European mid-market consolidation.
            Comparable to NordicCare ApS (already IC ready) on growth profile and
            geographic footprint.
          </p>
        </section>

        <section
          className={cn(
            "flex flex-col gap-4 rounded-[20px] border border-foreground/[0.08]",
            "bg-surface/60 p-5",
          )}
        >
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
            Enrichment data
          </p>
          <Field label="Revenue FY24" value={`€${lead.revenue.toFixed(1)}M`} />
          <Field
            label="YoY growth"
            value={`${(lead.growth * 100).toFixed(0)}%`}
            tone={lead.growth >= 0.4 ? "good" : "default"}
          />
          <Field
            label="EBITDA margin"
            value={`${(lead.ebitdaMargin * 100).toFixed(0)}%`}
          />
          <Field label="Headcount" value={`${lead.headcount}`} />
          <Field label="Founded" value={`${lead.founded}`} />
          {lead.lastRound && <Field label="Last round" value={lead.lastRound} />}
          {lead.ownership && (
            <Field label="Cap table" value={lead.ownership} small />
          )}
          {lead.glassdoor && (
            <Field
              label="Glassdoor"
              value={`${lead.glassdoor.toFixed(1)} ★`}
              tone="good"
            />
          )}
          <Field label="Source" value={lead.source} />
        </section>
      </div>
    </div>
  );
}

function BreakdownRow({
  row,
}: {
  row: { axis: string; score: number; max: number; rationale: string };
}) {
  const isNegative = row.max < 0;
  const widthPct = isNegative
    ? (Math.abs(row.score) / Math.abs(row.max)) * 100
    : (row.score / row.max) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12.5px] text-foreground/85">{row.axis}</p>
        <p
          className={cn(
            "shrink-0 tabular text-[12.5px] font-medium",
            isNegative ? "text-warm" : "text-foreground",
          )}
        >
          {row.score >= 0 ? "+" : ""}
          {row.score} / {row.max}
        </p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.05]">
        <div
          className={cn(
            "h-full rounded-full",
            isNegative ? "bg-warm/65" : widthPct >= 80 ? "bg-sev-low" : "bg-foreground/55",
          )}
          style={{ width: `${Math.min(widthPct, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-foreground/55">{row.rationale}</p>
    </div>
  );
}

function Field({
  label,
  value,
  tone = "default",
  small = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "good";
  small?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-foreground/[0.06] pt-3 first:border-0 first:pt-0">
      <span className="text-[11.5px] text-foreground/55">{label}</span>
      <span
        className={cn(
          "text-right tabular",
          small ? "text-[11.5px]" : "text-[13px] font-medium",
          tone === "good" ? "text-sev-low" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function countryName(geo: string): string {
  const map: Record<string, string> = {
    FR: "France",
    DE: "Germany",
    DK: "Denmark",
    EE: "Estonia",
    ES: "Spain",
    IE: "Ireland",
    NL: "Netherlands",
    CH: "Switzerland",
    PT: "Portugal",
    BE: "Belgium",
    SE: "Sweden",
  };
  return map[geo] ?? geo;
}
