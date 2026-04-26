import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { Deal } from "@/src/lib/mock/deals";
import { team } from "@/src/lib/mock/fund";

export function DealCard({ deal }: { deal: Deal }) {
  const owner = deal.owner ? team.find((t) => t.id === deal.owner) : null;
  const fitTone = scoreTone(deal.thesisFit);

  return (
    <Link
      href={`/pipeline/${deal.id}/overview`}
      className={cn(
        "group flex flex-col gap-2.5 rounded-[14px]",
        "border border-foreground/[0.08] bg-surface/60 p-3",
        "transition-all duration-150 ease-out",
        "hover:border-foreground/15 hover:bg-surface",
        "hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.6)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium leading-tight">
            {deal.flag} {deal.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-foreground/50">
            {deal.sector}
          </p>
        </div>
        {deal.thesisFit !== null && (
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5",
              "text-[10.5px] font-medium tabular",
              fitTone,
            )}
          >
            {deal.thesisFit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="tabular text-[12.5px] text-foreground/80">
          €{deal.revenue.toFixed(1)}M
        </span>
        {deal.redFlags > 0 && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full",
              "border border-warm/25 bg-warm/10 px-1.5 py-0.5",
              "text-[10.5px] font-medium tabular text-warm",
            )}
          >
            <AlertTriangle strokeWidth={1.8} className="size-2.5" />
            {deal.redFlags}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-foreground/[0.06] pt-2">
        {owner ? (
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full",
              "text-[9.5px] font-medium tracking-tight text-foreground",
            )}
            style={{ background: `hsl(${owner.avatarHue} 60% 35%)` }}
            title={owner.name}
          >
            {owner.initials}
          </span>
        ) : (
          <span className="text-[10px] text-foreground/40">Unassigned</span>
        )}
        {deal.timeSavedDays > 0 && (
          <span className="text-[10px] tabular text-foreground/45">
            ⏱ {deal.timeSavedDays.toFixed(1)}d saved
          </span>
        )}
      </div>
    </Link>
  );
}

function scoreTone(score: number | null): string {
  if (score === null) return "bg-foreground/10 text-foreground/50";
  if (score >= 80) return "bg-sev-low/15 text-sev-low";
  if (score >= 65) return "bg-sev-med/15 text-sev-med";
  return "bg-sev-crit/15 text-sev-crit";
}
