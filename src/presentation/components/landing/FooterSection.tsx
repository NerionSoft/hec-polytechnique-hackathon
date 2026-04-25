import { BrandMark } from "./BrandMark";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function FooterSection() {
  const { footer } = landingContent;

  return (
    <footer className="border-t border-foreground/[0.08]">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1200px] flex-col gap-10",
          "px-6 py-16",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-6 border-b border-foreground/[0.08]",
            "pb-10 md:flex-row md:items-end md:justify-between",
          )}
        >
          <p
            className={cn(
              "max-w-3xl text-[12px] leading-relaxed",
              "text-foreground/50",
            )}
          >
            {footer.disclaimer}
          </p>
          <div
            className={cn(
              "flex items-center gap-3",
              "text-[12px] text-foreground/60",
            )}
          >
            <span>{footer.powered}</span>
            <span
              className={cn(
                "font-serif text-[16px] text-foreground/80",
              )}
            >
              {footer.poweredBy}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-10",
            "md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,160px))]",
          )}
        >
          <div className="flex flex-col gap-3">
            <a
              href="#top"
              className="flex items-center gap-2 text-foreground"
            >
              <BrandMark size={16} />
              <span
                className={cn(
                  "font-serif text-[18px] tracking-tight",
                )}
              >
                {footer.wordmark}
              </span>
            </a>
            <p
              className={cn(
                "max-w-md text-[12px] leading-relaxed",
                "text-foreground/50",
              )}
            >
              {footer.address}
            </p>
            <p className="mt-4 text-[11px] text-foreground/40">
              {footer.copyright}
            </p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p
                className={cn(
                  "text-[11px] uppercase tracking-[0.14em]",
                  "text-foreground/40",
                )}
              >
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className={cn(
                        "text-[13px] text-foreground/70",
                        "transition-opacity hover:text-foreground",
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

      <div
        className={cn(
          "overflow-hidden border-t border-foreground/[0.06]",
        )}
        aria-hidden="true"
      >
        <p
          className={cn(
            "select-none text-center font-serif font-light",
            "leading-none tracking-[-0.05em] text-foreground/[0.06]",
            "text-[clamp(80px,22vw,280px)]",
          )}
        >
          {footer.wordmark}
        </p>
      </div>
    </footer>
  );
}
