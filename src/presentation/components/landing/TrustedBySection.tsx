import { GlassButton } from "./GlassButton";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function TrustedBySection() {
  const { trustedBy } = landingContent;

  return (
    <section
      className={cn("border-foreground/[0.08] border-y", "bg-background/40 backdrop-blur-[34px]")}
      aria-label={trustedBy.label}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1200px]",
          "flex-col items-center gap-6 px-6 py-10",
          "md:flex-row md:items-center md:justify-between",
        )}
      >
        <div className="flex flex-col items-center gap-5 md:items-start">
          <p className={cn("text-[12px] tracking-[0.16em] uppercase", "text-foreground/50")}>
            {trustedBy.label}
          </p>
          <ul
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-10",
              "gap-y-4 md:justify-start",
            )}
          >
            {trustedBy.logos.map((logo) => (
              <li
                key={logo}
                className={cn(
                  "font-serif text-[18px] font-normal",
                  "text-foreground/80 tracking-tight",
                )}
              >
                {logo}
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn(
            "flex max-w-md items-center gap-4",
            "border-foreground/10 rounded-[24px] border",
            "bg-foreground/[0.04] px-5 py-4 backdrop-blur-[34px]",
          )}
        >
          <p className="text-foreground/70 text-[13px]">{trustedBy.cookies.message}</p>
          <GlassButton size="sm" variant="glass">
            {trustedBy.cookies.cta}
          </GlassButton>
        </div>
      </div>
    </section>
  );
}
