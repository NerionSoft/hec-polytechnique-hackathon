import { Check } from "lucide-react";
import { IcMemoMockup } from "./mockups/IcMemoMockup";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function PlatformSection() {
  const { platform } = landingContent;

  return (
    <section id="audience" className={cn("mx-auto w-full max-w-[1200px] px-6", "py-20")}>
      <h2
        className={cn(
          "mb-12 max-w-[640px] whitespace-pre-line",
          "font-serif text-[36px] leading-tight font-light",
          "text-foreground tracking-tight sm:text-[44px]",
        )}
      >
        {platform.title}
      </h2>

      <div className={cn("grid gap-10 lg:grid-cols-[minmax(0,360px)_1fr]", "lg:items-start")}>
        <div className="flex flex-col gap-6">
          <h3
            className={cn("font-serif text-[22px] font-normal", "text-foreground tracking-tight")}
          >
            {platform.column.heading}
          </h3>
          <p className="text-foreground/70 text-[15px] leading-relaxed">{platform.column.lead}</p>
          <div className="flex flex-col gap-3">
            <p className="text-foreground text-[14px] font-medium">
              {platform.column.sectionTitle}
            </p>
            <p className={cn("text-[13px] leading-relaxed", "text-foreground/70")}>
              {platform.column.body}
            </p>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {platform.column.features.map((feature) => (
              <li
                key={feature}
                className={cn("flex items-center gap-3 text-[14px]", "text-foreground/75")}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center",
                    "border-accent/30 rounded-full border",
                    "bg-accent/10",
                  )}
                  aria-hidden="true"
                >
                  <Check strokeWidth={2} className="text-accent size-3" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <p className={cn("mt-4 text-[13px] italic", "text-foreground/50")}>
            {platform.column.footer}
          </p>
        </div>

        <div className="relative">
          <IcMemoMockup />
        </div>
      </div>
    </section>
  );
}
