import Image from "next/image";
import { GlassButton } from "./GlassButton";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

type Card = (typeof landingContent.products.cards)[number];

const WAVEFORM_HEIGHTS = [
  "h-1.5",
  "h-3",
  "h-4",
  "h-2",
  "h-3.5",
  "h-2.5",
  "h-4",
  "h-1.5",
  "h-3",
  "h-2",
  "h-3.5",
  "h-2",
] as const;

export function ProductsSection() {
  const { products } = landingContent;

  return (
    <section
      id="offer"
      className={cn(
        "mx-auto w-full max-w-[1200px] px-6",
        "py-20",
      )}
    >
      <h2
        className={cn(
          "mb-12 font-serif font-light tracking-tight",
          "text-[36px] leading-tight text-foreground",
          "sm:text-[44px]",
        )}
      >
        {products.title}
      </h2>

      <div className="grid gap-8 md:grid-cols-2">
        {products.cards.map((card) => (
          <ProductCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ card }: { card: Card }) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden",
        "rounded-[24px] border border-foreground/10",
        "bg-foreground/[0.03] backdrop-blur-[34px]",
      )}
    >
      <div
        className={cn(
          "relative flex h-[420px] items-center justify-center",
          "overflow-hidden border-b border-foreground/10",
        )}
      >
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="relative z-10 w-full px-6">
          {card.visual.kind === "recording" ? (
            <RecordingVisual label={card.visual.label} />
          ) : (
            <PerformanceVisual visual={card.visual} />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-5 p-10">
        <span
          className={cn(
            "text-[12px] uppercase tracking-[0.18em]",
            "text-foreground/50",
          )}
        >
          {card.tag}
        </span>
        <h3
          className={cn(
            "font-serif text-[34px] font-normal leading-[1.1]",
            "tracking-tight text-foreground sm:text-[40px]",
          )}
        >
          {card.title}
        </h3>
        <p
          className={cn(
            "max-w-[480px] text-[16px] leading-relaxed",
            "text-foreground/70",
          )}
        >
          {card.description}
        </p>
        <div className="pt-3">
          <GlassButton size="md" variant="glass">
            {card.cta}
          </GlassButton>
        </div>
      </div>
    </article>
  );
}

function RecordingVisual({ label }: { label: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex h-16 w-full max-w-[420px]",
        "items-center gap-4 rounded-[100px]",
        "border border-foreground/10",
        "bg-foreground/[0.06] px-7 backdrop-blur-[34px]",
      )}
    >
      <span className="size-2.5 rounded-full bg-warm" />
      <span className="text-[15px] text-foreground/80">{label}</span>
      <span className="ml-auto flex items-center gap-1.5">
        {WAVEFORM_HEIGHTS.map((h, idx) => (
          <span
            key={`${idx}-${h}`}
            className={cn(
              "block w-[3px] rounded-full bg-foreground/40",
              h,
            )}
          />
        ))}
      </span>
    </div>
  );
}

type PerformanceVisual = Extract<
  Card["visual"],
  { kind: "performance" }
>;

function PerformanceVisual({ visual }: { visual: PerformanceVisual }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[460px] rounded-[20px]",
        "border border-foreground/10 bg-background/60",
        "p-7 backdrop-blur-[34px]",
      )}
    >
      <p
        className={cn(
          "text-[12px] uppercase tracking-[0.16em]",
          "text-foreground/50",
        )}
      >
        {visual.heading}
      </p>
      <p
        className={cn(
          "mt-2 font-serif text-[40px] font-normal",
          "tracking-tight text-foreground",
        )}
      >
        {visual.value}
      </p>
      <p className="mt-1 text-[12px] text-foreground/50">
        {visual.period}
      </p>
      <ul className="mt-5 space-y-2.5 text-[13px]">
        {visual.rows.map((row) => (
          <li
            key={row.label}
            className={cn(
              "flex justify-between rounded-md",
              "bg-foreground/[0.03] px-3 py-2 text-foreground/70",
            )}
          >
            <span>{row.label}</span>
            <span className="flex gap-3 text-foreground/60">
              <span>{row.current}</span>
              <span>{row.target}</span>
              <span className="text-accent">{row.trade}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
