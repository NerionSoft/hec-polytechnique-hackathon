import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { quarterStats } from "@/src/lib/mock/deals";

export function QuarterStrip() {
  return (
    <div
      className={cn(
        "mx-8 mb-6 overflow-hidden rounded-[20px]",
        "border border-foreground/[0.08] bg-foreground/[0.02]",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-4",
          "border-b border-foreground/[0.08] px-5 py-2.5",
        )}
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-foreground/45">
          <Sparkles strokeWidth={1.6} className="size-3" />
          This quarter · Q2 2026
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-foreground/55">
          <TrendingUp strokeWidth={1.6} className="size-3 text-sev-low" />
          <span className="tabular text-sev-low">+38%</span>
          <span>vs Q1</span>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-foreground/[0.08] sm:grid-cols-4 sm:divide-x">
        <Stat
          label="Leads sourced"
          value={`${quarterStats.leadsSourced}`}
          tone="default"
        />
        <Stat
          label="In diligence"
          value={`${quarterStats.inDD}`}
          tone="default"
        />
        <Stat
          label="IC ready"
          value={`${quarterStats.icReady}`}
          tone="warm"
        />
        <Stat
          label="Analyst-days saved"
          value={`${quarterStats.daysSaved.toFixed(1)}`}
          suffix="d"
          tone="accent"
          highlight
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  tone = "default",
  highlight = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "default" | "warm" | "accent";
  highlight?: boolean;
}) {
  const toneClass =
    tone === "warm"
      ? "text-warm"
      : tone === "accent"
        ? "text-foreground"
        : "text-foreground";
  return (
    <div className={cn("flex flex-col gap-1 px-5 py-4", highlight && "bg-foreground/[0.02]")}>
      <p className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
        {label}
      </p>
      <p
        className={cn(
          "tabular font-serif text-[26px] leading-none tracking-tight",
          toneClass,
        )}
      >
        {value}
        {suffix && (
          <span className="ml-0.5 text-[15px] text-foreground/45">{suffix}</span>
        )}
      </p>
      {highlight && (
        <p className="flex items-center gap-1 text-[10.5px] text-foreground/45">
          <ArrowUpRight strokeWidth={1.6} className="size-3" />
          5 days &rarr; 28 minutes per deal
        </p>
      )}
    </div>
  );
}
