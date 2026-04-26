import {
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageCircleQuestion,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { landingContent } from "@/src/presentation/content/landing.content";

export function IcMemoMockup() {
  const { icMemo } = landingContent;

  return (
    <div
      className={cn(
        "border-foreground/10 w-full rounded-[24px] border",
        "bg-background/70 backdrop-blur-[34px]",
        "shadow-[0_30px_120px_-40px_rgba(0,0,0,0.6)]",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-4",
          "border-foreground/[0.08] border-b px-6 py-4",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-8 items-center justify-center",
              "border-foreground/10 rounded-full border",
              "bg-foreground/[0.04]",
            )}
            aria-hidden="true"
          >
            <FileText strokeWidth={1.5} className="text-foreground/80 size-4" />
          </span>
          <div className="min-w-0">
            <p className={cn("truncate font-serif text-[16px]", "text-foreground tracking-tight")}>
              {icMemo.title}
            </p>
            <p className="text-foreground/50 truncate text-[11px]">{icMemo.subtitle}</p>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full",
            "border-accent/30 bg-accent/10 border px-2.5 py-1",
            "text-[10.5px] tracking-[0.14em] uppercase",
            "text-accent",
          )}
        >
          <ShieldCheck strokeWidth={1.8} className="size-3" />
          {icMemo.badge}
        </span>
      </header>

      <ol className="divide-foreground/[0.08] divide-y">
        {icMemo.sections.map((section) => (
          <li key={section.id} className="flex gap-4 px-6 py-4">
            <span
              className={cn(
                "shrink-0 font-serif text-[12px]",
                "text-foreground/40 tracking-[0.18em]",
              )}
            >
              {section.id}
            </span>
            <div className="flex-1">
              <h4 className={cn("font-serif text-[16px] tracking-tight", "text-foreground")}>
                {section.title}
              </h4>
              <p className={cn("mt-1.5 text-[13px] leading-relaxed", "text-foreground/70")}>
                {section.body}
              </p>
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5",
                  "border-foreground/10 rounded-full border",
                  "bg-foreground/[0.03] px-2.5 py-1",
                  "text-foreground/55 text-[10.5px]",
                )}
              >
                <Quote strokeWidth={1.6} className="size-3" />
                {section.citation}
              </p>
            </div>
            <ChevronRight strokeWidth={1.5} className="text-foreground/30 mt-1 size-4" />
          </li>
        ))}
      </ol>

      <section className="border-foreground/[0.08] border-t px-6 py-4">
        <p
          className={cn(
            "mb-3 flex items-center gap-2 text-[11px]",
            "text-foreground/45 tracking-[0.16em] uppercase",
          )}
        >
          <MessageCircleQuestion strokeWidth={1.6} className="size-3.5" />
          {icMemo.questions.title}
        </p>
        <ul className="flex flex-col gap-2">
          {icMemo.questions.items.map((q) => (
            <li
              key={q}
              className={cn(
                "flex items-start gap-2 text-[12.5px]",
                "text-foreground/70 leading-relaxed",
              )}
            >
              <CheckCircle2
                strokeWidth={1.5}
                className={cn("text-accent/80 mt-0.5 size-3.5 shrink-0")}
              />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
