import { BrandMark } from "./BrandMark";
import { GlassButton } from "./GlassButton";
import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function Navigation() {
  const { brand, navigation } = landingContent;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-background/40 backdrop-blur-[34px]",
        "border-b border-foreground/[0.08]",
      )}
    >
      <nav
        className={cn(
          "mx-auto flex h-16 w-full max-w-[1200px]",
          "items-center justify-between px-6",
        )}
        aria-label="Primary"
      >
        <a
          href="#top"
          className={cn(
            "flex items-center gap-2",
            "text-foreground transition-opacity",
            "hover:opacity-80",
          )}
        >
          <BrandMark size={18} />
          <span
            className={cn(
              "font-serif text-[18px] font-normal leading-none",
              "tracking-tight",
            )}
          >
            {brand.name}
          </span>
        </a>

        <ul
          className={cn(
            "hidden items-center gap-8 md:flex",
            "text-[14px] font-normal",
          )}
        >
          {navigation.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={cn(
                  "text-foreground/70 transition-opacity",
                  "duration-200 ease-out hover:text-foreground",
                )}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <GlassButton size="sm" variant="glass">
          {navigation.cta}
        </GlassButton>
      </nav>
    </header>
  );
}
