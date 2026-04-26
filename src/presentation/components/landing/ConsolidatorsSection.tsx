import Image from "next/image";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function ConsolidatorsSection() {
  const { consolidators } = landingContent;
  const card = consolidators.chartCard;

  return (
    <section id="pricing" className={cn("mx-auto w-full max-w-[1200px] px-6", "py-20")}>
      <h2
        className={cn(
          "mb-12 font-serif text-[36px] font-light",
          "text-foreground tracking-tight sm:text-[44px]",
        )}
      >
        {consolidators.title}
      </h2>

      <div className={cn("grid gap-10 lg:grid-cols-[1fr_minmax(0,400px)]", "lg:items-start")}>
        <div
          className={cn(
            "relative h-[420px] overflow-hidden",
            "border-foreground/10 rounded-[24px] border",
          )}
        >
          <Image
            src="/images/card.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
          <div className={cn("relative z-10 flex h-full items-end p-6")}>
            <div
              className={cn(
                "w-full max-w-[320px] rounded-[18px]",
                "border-foreground/10 bg-background/60 border",
                "p-5 backdrop-blur-[34px]",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-foreground/70 text-[12px]")}>{card.label}</span>
                <span
                  className={cn(
                    "border-foreground/10 rounded-full border",
                    "text-foreground/60 px-2 py-0.5 text-[10px]",
                  )}
                >
                  {card.tag}
                </span>
              </div>
              <p
                className={cn("mt-4 text-[11px] tracking-[0.14em] uppercase", "text-foreground/50")}
              >
                {card.metricLabel}
              </p>
              <p
                className={cn(
                  "mt-1 font-serif text-[28px] font-normal",
                  "text-foreground tracking-tight",
                )}
              >
                {card.metricValue}
              </p>
              <p className="text-foreground/50 mt-1 text-[11px]">{card.caption}</p>
              <Sparkline className="mt-3" />
              <p
                className={cn("mt-3 text-[10px] uppercase", "text-foreground/40 tracking-[0.14em]")}
              >
                {card.pill}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h3
            className={cn("font-serif text-[22px] font-normal", "text-foreground tracking-tight")}
          >
            {consolidators.column.heading}
          </h3>
          <p className="text-foreground text-[15px] font-medium">
            {consolidators.column.sectionTitle}
          </p>
          <p className={cn("text-foreground/70 text-[13px] leading-relaxed")}>
            {consolidators.column.body}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {consolidators.column.features.map((feature) => (
              <li
                key={feature}
                className={cn("flex items-center gap-3 text-[14px]", "text-foreground/70")}
              >
                <span aria-hidden="true" className="bg-foreground/40 size-1.5 rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
          <p className={cn("text-foreground/50 mt-3 text-[13px] italic")}>
            {consolidators.column.footer}
          </p>
        </div>
      </div>
    </section>
  );
}

function Sparkline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 50"
      className={cn("text-accent h-12 w-full", className)}
      aria-hidden="true"
    >
      <path
        d="M0 35 L25 30 L50 32 L75 22 L100 26 L125 14 L150 18 L175 8 L200 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
