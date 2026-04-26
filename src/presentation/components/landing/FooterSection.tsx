import { BrandMark } from "./BrandMark";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function FooterSection() {
  const { footer } = landingContent;

  return (
    <footer className="border-foreground/[0.08] border-t">
      <div className={cn("mx-auto flex w-full max-w-[1200px] flex-col gap-10", "px-6 py-16")}>
        <div className={cn("border-foreground/[0.08] border-b pb-10")}>
          <p className={cn("max-w-3xl text-[12px] leading-relaxed", "text-foreground/50")}>
            {footer.disclaimer}
          </p>
        </div>

        <div
          className={cn("grid gap-10", "md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,160px))]")}
        >
          <div className="flex flex-col gap-3">
            <a href="#top" className="text-foreground flex items-center gap-2">
              <BrandMark size={16} />
              <span className={cn("font-serif text-[18px] tracking-tight")}>{footer.wordmark}</span>
            </a>
            <p className={cn("max-w-md text-[12px] leading-relaxed", "text-foreground/50")}>
              {footer.address}
            </p>
            <p className="text-foreground/40 mt-4 text-[11px]">{footer.copyright}</p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className={cn("text-[11px] tracking-[0.14em] uppercase", "text-foreground/40")}>
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className={cn(
                        "text-foreground/70 text-[13px]",
                        "hover:text-foreground transition-opacity",
                      )}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={cn("border-foreground/[0.06] overflow-hidden border-t")} aria-hidden="true">
        <p
          className={cn(
            "text-center font-serif font-light select-none",
            "text-foreground/[0.06] leading-none tracking-[-0.05em]",
            "text-[clamp(80px,22vw,280px)]",
          )}
        >
          {footer.wordmark}
        </p>
      </div>
    </footer>
  );
}
