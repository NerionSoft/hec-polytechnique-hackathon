import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function PipelineSection() {
  const { pipeline } = landingContent;

  return (
    <section id="pipeline" className={cn("mx-auto w-full max-w-[1200px] px-6", "py-20")}>
      <div className="mb-12 max-w-[640px]">
        <h2
          className={cn(
            "font-serif font-light whitespace-pre-line",
            "text-[36px] leading-tight tracking-tight",
            "text-foreground sm:text-[44px]",
          )}
        >
          {pipeline.title}
        </h2>
        <p className={cn("mt-5 text-[15px] leading-relaxed", "text-foreground/70")}>
          {pipeline.subtitle}
        </p>
      </div>

      <ol className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3")}>
        {pipeline.stages.map((stage, idx) => (
          <li key={stage.id} className="relative">
            <PipelineCard stage={stage} />
            <Connector index={idx} total={pipeline.stages.length} />
          </li>
        ))}
      </ol>
    </section>
  );
}

type Stage = (typeof landingContent.pipeline.stages)[number];

function PipelineCard({ stage }: { stage: Stage }) {
  const isHuman = stage.coverage === "Human";

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-[24px]",
        "border-foreground/10 border",
        "bg-foreground/[0.03] p-6 backdrop-blur-[34px]",
        "transition-colors duration-200 ease-out",
        "hover:bg-foreground/[0.05]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("font-serif text-[14px] tracking-[0.18em]", "text-foreground/40")}>
          {stage.id}
        </span>
        <span
          className={cn(
            "rounded-full border px-3 py-1",
            "text-[10px] tracking-[0.14em] uppercase",
            isHuman ? "border-warm/40 text-warm" : "border-accent/40 text-accent",
          )}
        >
          {isHuman ? "Human review" : `${stage.coverage} automated`}
        </span>
      </div>
      <h3 className={cn("font-serif text-[20px] font-normal tracking-tight", "text-foreground")}>
        {stage.title}
      </h3>
      <p className="text-foreground/70 text-[13px] leading-relaxed">{stage.body}</p>
    </article>
  );
}

function Connector({ index, total }: { index: number; total: number }) {
  if (index === total - 1) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-1/2 right-[-6px]",
        "hidden size-3 -translate-y-1/2 rotate-45",
        "border-foreground/20 border-t border-r",
        "lg:block",
      )}
    />
  );
}
