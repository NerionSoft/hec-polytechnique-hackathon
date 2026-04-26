import Link from "next/link";
import { AlertTriangle, ChevronLeft, Clock, MoreHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { GlassButton } from "@/src/presentation/components/landing/GlassButton";
import type { Deal } from "@/src/lib/mock/deals";
import { stages, stageLabels } from "@/src/lib/mock/deals";
import type { PipelineEntityKind } from "@/src/lib/data/pipeline";
import { WorkspaceActions } from "./WorkspaceActions";

export function DealHeader({
  deal,
  entityKind = "mock",
  sourceId,
}: {
  deal: Deal;
  entityKind?: PipelineEntityKind;
  sourceId?: string;
}) {
  const stageIndex = stages.indexOf(deal.stage);
  const showWorkspaceActions = (entityKind === "lead" || entityKind === "deal") && sourceId;

  return (
    <div className="border-foreground/[0.08] border-b">
      <div className="px-4 pt-6 sm:px-8">
        <Link
          href="/pipeline"
          className={cn(
            "text-foreground/55 inline-flex items-center gap-1 text-[12px]",
            "hover:text-foreground transition-colors",
          )}
        >
          <ChevronLeft strokeWidth={1.6} className="size-3.5" />
          Pipeline
        </Link>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                "font-serif leading-[1.05] tracking-tight",
                "text-foreground text-[26px] sm:text-[34px]",
              )}
            >
              {deal.flag} {deal.name}
            </h1>
            <p className="text-foreground/55 mt-1 text-[12.5px] sm:text-[13px]">
              {countryName(deal.geo)} · {deal.sector} · Founded {deal.founded} · {deal.employees}{" "}
              employees
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {showWorkspaceActions ? (
              <WorkspaceActions
                entityKind={entityKind}
                sourceId={sourceId}
                stage={deal.stage}
                decision={deal.decision}
              />
            ) : (
              <>
                <GlassButton size="sm" variant="glass">
                  <Sparkles strokeWidth={1.6} className="size-3.5" />
                  Generate memo
                </GlassButton>
                <GlassButton size="sm" variant="solid">
                  Schedule IC
                </GlassButton>
              </>
            )}
            <button
              type="button"
              aria-label="More"
              className={cn(
                "flex size-8 items-center justify-center rounded-full",
                "border-foreground/[0.08] text-foreground/55 border",
                "hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <MoreHorizontal strokeWidth={1.6} className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 pb-2 sm:gap-x-8">
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
          <Stat label="Coverage" value={`${Math.round(deal.coverage * 100)}%`} tone="default" />
        </div>
      </div>
    </div>
  );
}

function StageBar({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">Stage</p>
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
        <span className="text-foreground ml-2 text-[12px] font-medium">
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
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
      <p className={cn("tabular flex items-center gap-1 text-[14.5px] font-medium", toneClass)}>
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
