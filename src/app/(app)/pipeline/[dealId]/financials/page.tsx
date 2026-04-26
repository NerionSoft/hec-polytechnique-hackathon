import { notFound } from "next/navigation";
import { cn } from "@/src/presentation/lib/cn";
import { financialsHelios, type FinancialsHelios } from "@/src/lib/mock/financials";
import { findPipelineDeal, findPipelineFinancialSnapshot } from "@/src/lib/data/pipeline";
import { PageHeader } from "../../../_components/PageHeader";
import { KpiTiles } from "./_components/KpiTiles";
import { TrendChart } from "./_components/TrendChart";
import { EbitdaBridge } from "./_components/EbitdaBridge";
import { ConcentrationBar } from "./_components/ConcentrationBar";
import { WorkingCapital } from "./_components/WorkingCapital";
import { CitationLink } from "../_components/CitationLink";

export default async function FinancialsPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = await findPipelineDeal(dealId);
  if (!deal) notFound();
  const snapshot = await findPipelineFinancialSnapshot(dealId);
  const f: FinancialsHelios = snapshot
    ? {
        trend: (snapshot.trendJson as FinancialsHelios["trend"] | null) ?? financialsHelios.trend,
        ebitdaBridge:
          (snapshot.bridgeJson as FinancialsHelios["ebitdaBridge"] | null) ??
          financialsHelios.ebitdaBridge,
        customerConcentration:
          (snapshot.concentrationJson as FinancialsHelios["customerConcentration"] | null) ??
          financialsHelios.customerConcentration,
        cohortRetention:
          (snapshot.retentionJson as FinancialsHelios["cohortRetention"] | null) ??
          financialsHelios.cohortRetention,
        workingCapital:
          (snapshot.workingCapitalJson as FinancialsHelios["workingCapital"] | null) ??
          financialsHelios.workingCapital,
      }
    : financialsHelios;

  return (
    <>
      <PageHeader
        title="Financials"
        description="Revenue and EBITDA trend, adjustments, customer concentration and working capital."
      />
      <KpiTiles deal={deal} />

      <div className="grid grid-cols-1 gap-4 px-4 py-6 sm:px-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader eyebrow="Revenue & EBITDA · 5-year trend" citation="c1" />
          <TrendChart data={f.trend} />
        </Card>

        <Card>
          <CardHeader
            eyebrow="EBITDA bridge FY24"
            citation="c2"
            badge={{ label: "2 flagged", tone: "warm" }}
          />
          <EbitdaBridge data={f.ebitdaBridge} />
        </Card>

        <Card>
          <CardHeader
            eyebrow="Customer concentration"
            citation="c3"
            badge={{ label: "Top-3 = 64%", tone: "warm" }}
          />
          <ConcentrationBar data={f.customerConcentration} />
        </Card>

        <Card>
          <CardHeader eyebrow="Cohort retention · FY24" />
          <div className="flex items-baseline gap-6">
            <Metric
              label="NRR"
              value={`${(f.cohortRetention.nrr * 100).toFixed(0)}%`}
              tone="good"
            />
            <Metric label="GRR" value={`${(f.cohortRetention.grr * 100).toFixed(0)}%`} />
            <Metric label="Churn" value={`${(f.cohortRetention.churn * 100).toFixed(1)}%/yr`} />
          </div>
          <p className="text-foreground/55 text-[11.5px] leading-relaxed">
            Net retention strong driven by upsell of analytics module. Churn concentrated on
            long-tail SMB customers — top-50 churn &lt; 2%.
          </p>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Working capital"
            citation="c1"
            badge={{ label: "Deteriorating", tone: "warm" }}
          />
          <WorkingCapital data={f.workingCapital} />
        </Card>
      </div>
    </>
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
  citation,
  badge,
}: {
  eyebrow: string;
  citation?: string;
  badge?: { label: string; tone: "warm" | "good" | "default" };
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{eyebrow}</p>
        {citation && <CitationLink id={citation} />}
      </div>
      {badge && (
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.1em] uppercase",
            badge.tone === "warm" && "border-warm/25 bg-warm/10 text-warm",
            badge.tone === "good" && "border-sev-low/25 bg-sev-low/10 text-sev-low",
            badge.tone === "default" &&
              "border-foreground/15 bg-foreground/[0.04] text-foreground/65",
          )}
        >
          {badge.label}
        </span>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warm";
}) {
  return (
    <div>
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
      <p
        className={cn(
          "tabular font-serif text-[24px] leading-none tracking-tight",
          tone === "good" && "text-sev-low",
          tone === "warm" && "text-warm",
        )}
      >
        {value}
      </p>
    </div>
  );
}
