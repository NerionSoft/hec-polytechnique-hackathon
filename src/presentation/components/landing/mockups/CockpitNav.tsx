import { cn } from "@/src/presentation/lib/cn";
import { landingContent } from "@/src/presentation/content/landing.content";
import { navIconMap } from "./cockpitIcons";

export function CockpitNav() {
  const { nav } = landingContent.cockpit;

  return (
    <aside
      aria-label="Workspace"
      className={cn(
        "hidden w-[180px] shrink-0 flex-col gap-1",
        "border-foreground/[0.08] border-r p-3",
        "lg:flex",
      )}
    >
      <div
        className={cn("mb-2 flex items-center gap-2 px-2 py-2", "text-foreground/50 text-[12px]")}
      >
        <span
          className={cn("border-foreground/15 size-6 rounded-full border", "bg-foreground/[0.04]")}
          aria-hidden="true"
        />
        <span className="text-foreground/80 font-serif text-[13px]">Athena</span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {nav.map((item, idx) => {
          const Icon = navIconMap[item.icon];
          const active = idx === 4;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg",
                  "px-2.5 py-2 text-[12.5px] transition-colors",
                  active
                    ? "bg-foreground/10 text-foreground"
                    : cn(
                        "text-foreground/55",
                        "hover:bg-foreground/[0.04]",
                        "hover:text-foreground/80",
                      ),
                )}
              >
                {Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.5} /> : null}
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
