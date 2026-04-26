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
      className={cn(
        "relative isolate overflow-hidden",
        "bg-background pb-24 pt-16",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
      >
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[1200px]",
          "flex-col items-center gap-8 px-6 pt-20 text-center",
        )}
      >
        <h1
          className={cn(
            "max-w-[860px] font-display font-extrabold",
            "text-[44px] leading-[1.02] tracking-[-0.035em]",
            "text-foreground sm:text-[58px] md:text-[68px]",
          )}
        >
          {hero.title}
        </h1>
        <p
          className={cn(
            "max-w-[560px] text-[16px] leading-relaxed",
            "text-foreground/70",
          )}
        >
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
