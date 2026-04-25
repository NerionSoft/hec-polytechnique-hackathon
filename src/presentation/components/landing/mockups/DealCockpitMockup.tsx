import { CircleDot, Download, MoreHorizontal, Sparkles } from "lucide-react";
import { GlassButton } from "../GlassButton";
import { cn } from "@/src/presentation/lib/cn";
import { landingContent } from "@/src/presentation/content/landing.content";
import { CockpitNav } from "./CockpitNav";
import { CockpitStream } from "./CockpitStream";
import { CockpitPanel } from "./CockpitPanel";

export function DealCockpitMockup() {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1080px]",
        "rounded-[28px] border border-foreground/10",
        "bg-foreground/[0.03] p-2 backdrop-blur-[34px]",
        "shadow-[0_50px_140px_-40px_rgba(0,0,0,0.7)]",
      )}
    >
      <div
        className={cn(
          "rounded-[22px] border border-foreground/[0.08]",
          "bg-background/80 backdrop-blur-[34px]",
        )}
      >
        <CockpitTopBar />
        <div
          className={cn(
            "flex min-h-[520px] divide-x divide-foreground/[0.08]",
          )}
        >
          <CockpitNav />
          <CockpitStream />
          <CockpitPanel />
        </div>
        <CockpitFooter />
      </div>
    </div>
  );
}

function CockpitTopBar() {
  const { cockpit } = landingContent;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        "border-b border-foreground/[0.08] px-5 py-3.5",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex size-7 items-center justify-center",
            "rounded-full bg-foreground/10",
          )}
          aria-hidden="true"
        >
          <Sparkles
            strokeWidth={1.6}
            className="size-3.5 text-foreground/80"
          />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-serif text-[15px]",
              "tracking-tight text-foreground",
            )}
          >
            {cockpit.deal}
          </p>
          <p
            className={cn(
              "truncate text-[11px] text-foreground/50",
            )}
          >
            {cockpit.breadcrumb}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full",
            "border border-warm/30 bg-warm/10 px-2.5 py-1",
            "text-[10.5px] uppercase tracking-[0.14em]",
            "text-warm",
          )}
        >
          <CircleDot strokeWidth={1.8} className="size-3" />
          {cockpit.statusLabel}
        </span>
        <span
          className={cn(
            "hidden text-[11px] text-foreground/50 sm:inline",
          )}
        >
          {cockpit.period}
        </span>
        <button
          type="button"
          aria-label="More options"
          className={cn(
            "flex size-7 items-center justify-center",
            "rounded-full text-foreground/60",
            "hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          <MoreHorizontal strokeWidth={1.6} className="size-4" />
        </button>
      </div>
    </div>
  );
}

function CockpitFooter() {
  const { cockpit } = landingContent;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        "border-t border-foreground/[0.08] px-5 py-3",
      )}
    >
      <p className="text-[11px] text-foreground/50">
        Last sync · 12 seconds ago
      </p>
      <div className="flex items-center gap-2">
        <GlassButton size="sm" variant="ghost">
          <Download strokeWidth={1.6} className="size-3.5" />
          {cockpit.actions.secondary}
        </GlassButton>
        <GlassButton size="sm" variant="solid">
          <Sparkles strokeWidth={1.6} className="size-3.5" />
          {cockpit.actions.primary}
        </GlassButton>
      </div>
    </div>
  );
}
