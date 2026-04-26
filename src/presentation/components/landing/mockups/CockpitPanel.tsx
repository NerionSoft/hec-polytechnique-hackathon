import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { landingContent } from "@/src/presentation/content/landing.content";

type Trend = "up" | "down" | "warn";

const trendIcon: Record<Trend, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  warn: AlertTriangle,
};

const trendColor: Record<Trend, string> = {
  up: "text-accent",
  down: "text-foreground/60",
  warn: "text-warm",
};

export function CockpitPanel() {
  const { stats, readiness, agents } = landingContent.cockpit;

  return (
    <aside
      className={cn(
        "hidden w-[260px] shrink-0 flex-col gap-4",
        "border-foreground/[0.08] border-l p-4 lg:flex",
      )}
      aria-label="Deal panel"
    >
      <div>
        <h5 className={cn("mb-2 text-[10px] tracking-[0.16em] uppercase", "text-foreground/45")}>
          {stats.title}
        </h5>
        <ul className="flex flex-col gap-2">
          {stats.items.map((s) => {
            const Icon = trendIcon[s.trend];
            return (
              <li
                key={s.label}
                className={cn(
                  "border-foreground/10 rounded-[12px] border",
                  "bg-foreground/[0.03] p-3",
                )}
              >
                <p className="text-foreground/55 text-[10.5px]">{s.label}</p>
                <p className={cn("mt-1 font-serif text-[18px]", "text-foreground")}>{s.value}</p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1.5 text-[10.5px]",
                    trendColor[s.trend],
                  )}
                >
                  <Icon strokeWidth={1.6} className="size-3" />
                  {s.delta}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={cn("border-foreground/10 rounded-[12px] border", "bg-foreground/[0.03] p-3")}>
        <p className={cn("text-[10px] tracking-[0.16em] uppercase", "text-foreground/45")}>
          {readiness.label}
        </p>
        <p className={cn("text-foreground mt-1 font-serif text-[20px]")}>{readiness.value}%</p>
        <div
          className={cn("mt-2 h-1.5 overflow-hidden rounded-full", "bg-foreground/10")}
          aria-hidden="true"
        >
          <span className={cn("bg-accent block h-full rounded-full", "w-[87%]")} />
        </div>
        <p className="text-foreground/50 mt-1.5 text-[10px]">{readiness.caption}</p>
      </div>

      <div>
        <h5 className={cn("mb-2 text-[10px] tracking-[0.16em] uppercase", "text-foreground/45")}>
          {agents.title}
        </h5>
        <ul className="flex flex-col gap-1.5">
          {agents.items.map((a) => {
            const Icon = a.status === "done" ? CheckCircle2 : Loader2;
            return (
              <li
                key={a.name}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg",
                  "px-2.5 py-1.5 text-[11.5px]",
                  "text-foreground/70",
                )}
              >
                <Icon
                  strokeWidth={1.6}
                  className={cn(
                    "size-3.5 shrink-0",
                    a.status === "done" ? "text-accent" : "text-warm",
                    a.status === "running" && "animate-spin",
                  )}
                />
                <span className="flex-1">{a.name}</span>
                <span className="text-foreground/40">{a.count}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
