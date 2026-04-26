import Link from "next/link";
import { ArrowRight, Pencil, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/src/presentation/lib/cn";
import { getDeal, stages, stageLabels } from "@/src/lib/mock/deals";
import { redFlagsForDeal } from "@/src/lib/mock/red-flags";
import { questionsForDeal } from "@/src/lib/mock/questions";
import { team } from "@/src/lib/mock/fund";
import { SeverityDot } from "../_components/SeverityBadge";
import { CitationLink } from "../_components/CitationLink";

export default async function OverviewPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = getDeal(dealId);
  if (!deal) notFound();

  const flags = redFlagsForDeal(dealId);
  const topFlags = [...flags]
    .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
    .slice(0, 5);
  const qs = questionsForDeal(dealId);
  const owner = deal.owner ? team.find((t) => t.id === deal.owner) : null;
  const stageIndex = stages.indexOf(deal.stage);

  return (
    <div className="grid grid-cols-1 gap-4 px-8 py-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          eyebrow="Investment Thesis"
          status="AI draft · approved"
          action={
            <button
              type="button"
              className={cn(
                "flex items-center gap-1 rounded-full",
                "border-foreground/[0.10] border px-2.5 py-1",
                "text-foreground/65 text-[11px] transition-colors",
                "hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <Pencil strokeWidth={1.6} className="size-3" />
              Edit
            </button>
          }
        />
        <p className="text-foreground/85 font-serif text-[18px] leading-[1.5] tracking-tight">
          {deal.name.split(" ")[0]} is a {countryAdj(deal.geo)} {deal.sector.toLowerCase()} player
          serving European retailers and food brands. The company has demonstrated{" "}
          <span className="text-foreground">
            {Math.round(deal.growth * 100)}% YoY revenue growth
          </span>
          <CitationLink id="c1" />, reaching{" "}
          <span className="text-foreground">€{deal.revenue.toFixed(1)}M in FY2024</span>
          <CitationLink id="c1" /> with{" "}
          <span className="text-foreground">
            {Math.round(deal.ebitdaMargin * 100)}% EBITDA margin
          </span>
          <CitationLink id="c2" />. The thesis rests on three pillars: (i) consolidation of the
          fragmented European mid-market, (ii) cross-sell of the recently launched analytics module
          (12% attach rate today, target 35% by 2027), and (iii) DACH expansion where the company
          has only 7% of revenue today.
        </p>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Key metrics"
          status={`Sourced ${deal.coverage > 0.5 ? "from data room" : "from enrichment"}`}
        />
        <dl className="divide-foreground/[0.06] flex flex-col divide-y">
          <Metric
            label="Revenue FY24"
            value={`€${deal.revenue.toFixed(1)}M`}
            delta={`${signed(deal.growth)} YoY`}
            citation="c1"
          />
          <Metric
            label="EBITDA FY24"
            value={`€${deal.ebitda.toFixed(1)}M`}
            delta={`${(deal.ebitdaMargin * 100).toFixed(1)}% margin`}
            citation="c2"
          />
          <Metric
            label="Net debt"
            value={`€${(deal.netDebtEbitda * deal.ebitda).toFixed(1)}M`}
            delta={`${deal.netDebtEbitda.toFixed(1)}× EBITDA`}
            tone={deal.netDebtEbitda > 3 ? "warn" : "default"}
            citation="c4"
          />
          <Metric label="Headcount" value={`${deal.employees}`} delta="+18 YoY" />
        </dl>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader
          eyebrow={`Top red flags · ${flags.length} total`}
          status={`${flags.filter((f) => f.status === "pending_review").length} awaiting review`}
          action={
            <Link
              href={`/pipeline/${dealId}/risks`}
              className={cn(
                "text-foreground/65 flex items-center gap-1 text-[12px]",
                "hover:text-foreground transition-colors",
              )}
            >
              See all
              <ArrowRight strokeWidth={1.6} className="size-3" />
            </Link>
          }
        />
        <ul className="divide-foreground/[0.06] flex flex-col divide-y">
          {topFlags.map((rf) => (
            <li key={rf.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <SeverityDot severity={rf.severity} />
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-[13px] font-medium">{rf.title}</p>
                <p className="text-foreground/55 mt-0.5 truncate text-[11.5px]">{rf.summary}</p>
              </div>
              <Link
                href={`/pipeline/${dealId}/risks#${rf.id}`}
                className={cn(
                  "text-foreground/55 shrink-0 text-[11px]",
                  "hover:text-foreground transition-colors",
                )}
              >
                view →
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader eyebrow="Stage timeline" status={`Owner: ${owner?.name ?? "Unassigned"}`} />
        <ol className="flex flex-col gap-2.5">
          {stages.map((s, i) => {
            const passed = i < stageIndex;
            const current = i === stageIndex;
            return (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-2.5 text-[12.5px]",
                  passed && "text-foreground/65",
                  current && "text-foreground",
                  !passed && !current && "text-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    passed && "bg-foreground/65",
                    current && "bg-warm",
                    !passed && !current && "bg-foreground/15",
                  )}
                />
                <span className="flex-1">{stageLabels[s]}</span>
                {current && <span className="text-warm text-[10.5px]">in progress</span>}
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader
          eyebrow={`Management questions · ${qs.length}`}
          status={`${qs.filter((q) => q.status === "pending_review").length} pending review · ${qs.filter((q) => q.status === "approved").length} approved`}
          action={
            <Link
              href={`/pipeline/${dealId}/memo`}
              className={cn(
                "bg-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
                "text-background text-[12px] font-medium transition-opacity",
                "hover:opacity-90",
              )}
            >
              <Sparkles strokeWidth={1.8} className="size-3.5" />
              Generate IC memo
            </Link>
          }
        />
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {qs.slice(0, 6).map((q) => (
            <li
              key={q.id}
              className={cn(
                "border-foreground/[0.06] bg-foreground/[0.015] rounded-[12px] border p-3",
              )}
            >
              <p className={cn("text-foreground/45 text-[10px] tracking-[0.14em] uppercase")}>
                {q.topic}
              </p>
              <p className="text-foreground/85 mt-1 line-clamp-3 text-[12.5px] leading-snug">
                {q.body}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "border-foreground/[0.08] flex flex-col gap-4 rounded-[20px] border",
        "bg-surface/60 p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({
  eyebrow,
  status,
  action,
}: {
  eyebrow: string;
  status?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{eyebrow}</p>
        {status && <p className="text-foreground/55 mt-1 truncate text-[11.5px]">{status}</p>}
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  tone = "default",
  citation,
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "default" | "warn";
  citation?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-1.5">
        <p className="text-foreground/55 text-[12px]">{label}</p>
        {citation && <CitationLink id={citation} />}
      </div>
      <div className="text-right">
        <p
          className={cn(
            "tabular text-[15px] font-medium",
            tone === "warn" ? "text-warm" : "text-foreground",
          )}
        >
          {value}
        </p>
        <p className="tabular text-foreground/45 text-[11px]">{delta}</p>
      </div>
    </div>
  );
}

function severityWeight(s: "low" | "medium" | "high" | "critical") {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s];
}

function signed(v: number) {
  const s = `${(v * 100).toFixed(1)}%`;
  return v > 0 ? `+${s}` : s;
}

function countryAdj(geo: string): string {
  const map: Record<string, string> = {
    FR: "French",
    DE: "German",
    DK: "Danish",
    EE: "Estonian",
    ES: "Spanish",
    IE: "Irish",
    NL: "Dutch",
    CH: "Swiss",
    PT: "Portuguese",
    BE: "Belgian",
  };
  return map[geo] ?? "European";
}
