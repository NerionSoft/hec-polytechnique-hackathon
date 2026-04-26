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
        <h1
          className={cn(
            "font-display max-w-[860px] font-extrabold",
            "text-[44px] leading-[1.02] tracking-[-0.035em]",
            "text-white sm:text-[58px] md:text-[68px]",
          )}
        >
          {hero.title}
        </h1>
        <p className={cn("max-w-[560px] text-[16px] leading-relaxed", "text-white/75")}>
          {hero.subtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <GlassButton variant="solid" size="md" className="bg-white text-black hover:bg-white/90">
            {hero.cta}
            <ArrowRight strokeWidth={1.6} className="size-4" />
          </GlassButton>
          <GlassButton
            variant="glass"
            size="md"
            className={cn("border-white/20 bg-white/10 text-white", "hover:bg-white/20")}
          >
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
