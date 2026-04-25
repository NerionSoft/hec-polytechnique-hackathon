import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function FeaturesSection() {
  const { features } = landingContent;

  return (
    <section
      id="features"
      className={cn(
        "mx-auto w-full max-w-[1200px] px-6",
        "py-20",
      )}
    >
      <div className="mb-12 flex flex-col gap-5 md:max-w-[640px]">
        <h2
          className={cn(
            "font-serif text-[36px] font-light leading-tight",
            "tracking-tight text-foreground sm:text-[44px]",
          )}
        >
          {features.title}
        </h2>
        <p
          className={cn(
            "text-[15px] leading-relaxed text-foreground/70",
          )}
        >
          {features.subtitle}
        </p>
      </div>

      <div
        className={cn(
          "grid gap-px rounded-[24px] overflow-hidden",
          "border border-foreground/10 bg-foreground/[0.06]",
          "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {features.items.map((item) => (
          <FeatureTile key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

type Item = (typeof landingContent.features.items)[number];

function FeatureTile({ item }: { item: Item }) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 bg-background p-7",
        "transition-colors duration-200 ease-out",
        "hover:bg-foreground/[0.04]",
      )}
    >
      <div className="flex items-center justify-between">
        <h3
          className={cn(
            "font-serif text-[20px] font-normal tracking-tight",
            "text-foreground",
          )}
        >
          {item.title}
        </h3>
        <CoverageBadge value={item.coverage} />
      </div>
      <p className="text-[13px] leading-relaxed text-foreground/70">
        {item.body}
      </p>
    </article>
  );
}

function CoverageBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-accent/40",
        "bg-accent/10 px-3 py-1 text-[11px]",
        "font-medium tracking-tight text-accent",
      )}
    >
      {value} automated
    </span>
  );
}
