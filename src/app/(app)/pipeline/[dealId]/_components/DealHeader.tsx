import Link from "next/link";
import { AlertTriangle, ChevronLeft, Clock, MoreHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { GlassButton } from "@/src/presentation/components/landing/GlassButton";
import type { Deal } from "@/src/lib/mock/deals";
import { stages, stageLabels } from "@/src/lib/mock/deals";

export function DealHeader({ deal }: { deal: Deal }) {
  const stageIndex = stages.indexOf(deal.stage);

  return (
    <div className="border-b border-foreground/[0.08]">
      <div className="px-8 pt-6">
        <Link
          href="/pipeline"
          className={cn(
            "inline-flex items-center gap-1 text-[12px] text-foreground/55",
            "transition-colors hover:text-foreground",
          )}
        >
          <ChevronLeft strokeWidth={1.6} className="size-3.5" />
          Pipeline
        </Link>

        <div className="mt-3 flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                "font-serif text-[34px] leading-[1.05] tracking-tight",
                "text-foreground",
              )}
            >
              {deal.flag} {deal.name}
            </h1>
            <p className="mt-1 text-[13px] text-foreground/55">
              {countryName(deal.geo)} · {deal.sector} · Founded {deal.founded} ·{" "}
              {deal.employees} employees
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <GlassButton size="sm" variant="glass">
              <Sparkles strokeWidth={1.6} className="size-3.5" />
              Generate memo
            </GlassButton>
            <GlassButton size="sm" variant="solid">
              Schedule IC
            </GlassButton>
            <button
              type="button"
              aria-label="More"
              className={cn(
                "flex size-8 items-center justify-center rounded-full",
                "border border-foreground/[0.08] text-foreground/55",
                "hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <MoreHorizontal strokeWidth={1.6} className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
          <StageBar currentIndex={stageIndex} />
          <Stat
            label="Thesis fit"
            value={deal.thesisFit !== null ? `${deal.thesisFit}/100` : "—"}
            tone={fitTone(deal.thesisFit)}
          />
          <Stat
            label="Red flags"
            value={`${deal.redFlags}`}
            tone="warm"
            icon={AlertTriangle}
            mute={deal.redFlags === 0}
          />
          <Stat
            label="Time saved"
            value={`${deal.timeSavedDays.toFixed(1)}d`}
            tone="default"
            icon={Clock}
          />
          <Stat
            label="Coverage"
            value={`${Math.round(deal.coverage * 100)}%`}
            tone="default"
          />
        </div>
      </div>
    </div>
  );
}

function StageBar({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
        Stage
      </p>
      <div className="flex items-center gap-1.5">
        {stages.map((s, i) => {
          const passed = i < currentIndex;
          const current = i === currentIndex;
          return (
            <span
              key={s}
              title={stageLabels[s]}
              className={cn(
                "h-1.5 w-5 rounded-full transition-colors",
                passed && "bg-foreground/65",
                current && "bg-warm",
                !passed && !current && "bg-foreground/[0.08]",
              )}
            />
          );
        })}
        <span className="ml-2 text-[12px] font-medium text-foreground">
          {stageLabels[stages[currentIndex]]}
        </span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
  icon: Icon,
  mute = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "warm" | "good" | "bad";
  icon?: typeof AlertTriangle;
  mute?: boolean;
}) {
  const toneClass = mute
    ? "text-foreground/40"
    : tone === "warm"
      ? "text-warm"
      : tone === "good"
        ? "text-sev-low"
        : tone === "bad"
          ? "text-sev-crit"
          : "text-foreground";

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
        {label}
      </p>
      <p className={cn("flex items-center gap-1 tabular text-[14.5px] font-medium", toneClass)}>
        {Icon && <Icon strokeWidth={1.8} className="size-3.5" />}
        {value}
      </p>
    </div>
  );
}

function fitTone(score: number | null): "default" | "good" | "warm" | "bad" {
  if (score === null) return "default";
  if (score >= 80) return "good";
  if (score >= 65) return "warm";
  return "bad";
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
  };
  return map[geo] ?? geo;
}
