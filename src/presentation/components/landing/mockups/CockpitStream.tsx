import {
  AlertCircle,
  AlertTriangle,
  Info,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { landingContent } from "@/src/presentation/content/landing.content";

type Severity = "high" | "medium" | "low";

const severityIcon: Record<Severity, LucideIcon> = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

const severityColor: Record<Severity, string> = {
  high: "text-warm",
  medium: "text-accent",
  low: "text-foreground/50",
};

const severityRing: Record<Severity, string> = {
  high: "border-warm/30 bg-warm/5",
  medium: "border-accent/30 bg-accent/5",
  low: "border-foreground/15 bg-foreground/[0.03]",
};

export function CockpitStream() {
  const { stream } = landingContent.cockpit;

  return (
    <section className="flex-1 px-4 pb-4 pt-3">
      <header
        className={cn(
          "mb-3 flex items-center justify-between",
        )}
      >
        <div>
          <h4
            className={cn(
              "font-serif text-[15px] text-foreground",
              "tracking-tight",
            )}
          >
            {stream.title}
          </h4>
          <p className="mt-0.5 text-[11px] text-foreground/50">
            {stream.meta}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border border-foreground/10",
            "bg-foreground/[0.04] px-2.5 py-1",
            "text-[10px] uppercase tracking-[0.14em]",
            "text-foreground/60",
          )}
        >
          Live
        </span>
      </header>

      <ul className="flex flex-col gap-2">
        {stream.items.map((item) => {
          const Icon = severityIcon[item.severity];
          return (
            <li
              key={item.title}
              className={cn(
                "rounded-[14px] border p-3",
                severityRing[item.severity],
              )}
            >
              <div className="flex items-start gap-3">
                <Icon
                  strokeWidth={1.6}
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    severityColor[item.severity],
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[12.5px] font-medium",
                        "text-foreground",
                      )}
                    >
                      {item.title}
                    </p>
                    <span
                      className={cn(
                        "rounded-full border border-foreground/10",
                        "px-2 py-0.5 text-[9px] uppercase",
                        "tracking-[0.14em] text-foreground/50",
                      )}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[11.5px] leading-relaxed",
                      "text-foreground/65",
                    )}
                  >
                    {item.body}
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 flex items-center gap-1.5",
                      "text-[10.5px] text-foreground/45",
                    )}
                  >
                    <Quote
                      strokeWidth={1.6}
                      className="size-3 shrink-0"
                    />
                    {item.source}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
