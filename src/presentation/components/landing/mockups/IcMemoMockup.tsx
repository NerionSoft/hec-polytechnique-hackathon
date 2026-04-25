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
        "w-full rounded-[24px] border border-foreground/10",
        "bg-background/70 backdrop-blur-[34px]",
        "shadow-[0_30px_120px_-40px_rgba(0,0,0,0.6)]",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-4",
          "border-b border-foreground/[0.08] px-6 py-4",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "flex size-8 items-center justify-center",
              "rounded-full border border-foreground/10",
              "bg-foreground/[0.04]",
            )}
            aria-hidden="true"
          >
            <FileText
              strokeWidth={1.5}
              className="size-4 text-foreground/80"
            />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-serif text-[16px]",
                "tracking-tight text-foreground",
              )}
            >
              {icMemo.title}
            </p>
            <p className="truncate text-[11px] text-foreground/50">
              {icMemo.subtitle}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full",
            "border border-accent/30 bg-accent/10 px-2.5 py-1",
            "text-[10.5px] uppercase tracking-[0.14em]",
            "text-accent",
          )}
        >
          <ShieldCheck strokeWidth={1.8} className="size-3" />
          {icMemo.badge}
        </span>
      </header>

      <ol className="divide-y divide-foreground/[0.08]">
        {icMemo.sections.map((section) => (
          <li key={section.id} className="flex gap-4 px-6 py-4">
            <span
              className={cn(
                "shrink-0 font-serif text-[12px]",
                "tracking-[0.18em] text-foreground/40",
              )}
            >
              {section.id}
            </span>
            <div className="flex-1">
              <h4
                className={cn(
                  "font-serif text-[16px] tracking-tight",
                  "text-foreground",
                )}
              >
                {section.title}
              </h4>
              <p
                className={cn(
                  "mt-1.5 text-[13px] leading-relaxed",
                  "text-foreground/70",
                )}
              >
                {section.body}
              </p>
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5",
                  "rounded-full border border-foreground/10",
                  "bg-foreground/[0.03] px-2.5 py-1",
                  "text-[10.5px] text-foreground/55",
                )}
              >
                <Quote strokeWidth={1.6} className="size-3" />
                {section.citation}
              </p>
            </div>
            <ChevronRight
              strokeWidth={1.5}
              className="mt-1 size-4 text-foreground/30"
            />
          </li>
        ))}
      </ol>

      <section className="border-t border-foreground/[0.08] px-6 py-4">
        <p
          className={cn(
            "mb-3 flex items-center gap-2 text-[11px]",
            "uppercase tracking-[0.16em] text-foreground/45",
          )}
        >
          <MessageCircleQuestion
            strokeWidth={1.6}
            className="size-3.5"
          />
          {icMemo.questions.title}
        </p>
        <ul className="flex flex-col gap-2">
          {icMemo.questions.items.map((q) => (
            <li
              key={q}
              className={cn(
                "flex items-start gap-2 text-[12.5px]",
                "leading-relaxed text-foreground/70",
              )}
            >
              <CheckCircle2
                strokeWidth={1.5}
                className={cn(
                  "mt-0.5 size-3.5 shrink-0 text-accent/80",
                )}
              />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
