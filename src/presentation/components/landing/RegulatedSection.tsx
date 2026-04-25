import { landingContent } from "@/src/presentation/content/landing.content";
import { cn } from "@/src/presentation/lib/cn";

export function RegulatedSection() {
  const { regulated } = landingContent;

  return (
    <section
      id="about"
      className={cn(
        "mx-auto w-full max-w-[1200px] px-6",
        "py-20",
      )}
    >
      <h2
        className={cn(
          "mb-12 max-w-[640px] whitespace-pre-line",
          "font-serif text-[36px] font-light leading-tight",
          "tracking-tight text-foreground sm:text-[44px]",
        )}
      >
        {regulated.title}
      </h2>

      <div className="grid gap-10 md:grid-cols-3">
        {regulated.items.map((item) => (
          <article key={item.title} className="flex flex-col gap-3">
            <RegulatedIcon />
            <h3
              className={cn(
                "text-[15px] font-medium text-foreground",
              )}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                "text-[13px] leading-relaxed",
                "text-foreground/60",
              )}
            >
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RegulatedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6 text-warm"
      aria-hidden="true"
    >
      <path
        d="M12 2 L20 6 V12 C20 17 16 21 12 22 C8 21 4 17 4 12 V6 L12 2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M9 12 L11 14 L15 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
