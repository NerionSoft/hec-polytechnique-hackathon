import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { DealCockpitMockup } from "./mockups/DealCockpitMockup";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function HeroSection() {
  const { hero } = landingContent;

  return (
    <section
      id="top"
      className={cn("relative isolate overflow-hidden", "bg-background pt-16 pb-24")}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      </div>

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[1200px]",
          "flex-col items-center gap-8 px-6 pt-20 text-center",
        )}
      >
        <span
          className={cn(
            "flex items-center gap-2 rounded-full",
            "border-foreground/10 bg-foreground/[0.06] border",
            "px-3 py-1 text-[11px] tracking-[0.16em] uppercase",
            "text-foreground/70 backdrop-blur-[34px]",
          )}
        >
          <span className="bg-accent size-1.5 rounded-full" />
          AI Due Diligence Copilot
        </span>
        <h1
          className={cn(
            "max-w-[820px] font-serif font-light",
            "text-[44px] leading-[1.05] tracking-[-0.02em]",
            "text-foreground sm:text-[56px] md:text-[64px]",
          )}
        >
          {hero.title}
        </h1>
        <p className={cn("max-w-[560px] text-[16px] leading-relaxed", "text-foreground/70")}>
          {hero.subtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <GlassButton variant="solid" size="md">
            {hero.cta}
            <ArrowRight strokeWidth={1.6} className="size-4" />
          </GlassButton>
          <GlassButton variant="glass" size="md">
            <Play strokeWidth={1.6} className="size-4" />
            {hero.secondaryCta}
          </GlassButton>
        </div>

        <div className="mt-12 w-full">
          <DealCockpitMockup />
        </div>
      </div>
    </section>
  );
}
