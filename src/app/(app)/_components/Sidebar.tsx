"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Radar, Gavel, Settings2, Hexagon, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { fund } from "@/src/lib/mock/fund";
import { useSidebarStore } from "@/src/lib/stores/sidebar-store";

const NAV_ITEMS = [
  { href: "/pipeline", label: "Pipeline", icon: LayoutDashboard },
  { href: "/sources", label: "Sources", icon: Radar },
  { href: "/ic", label: "IC Calendar", icon: Gavel, badge: "2" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  // Auto-close on route change (mobile)
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "bg-foreground/40 fixed inset-0 z-30 backdrop-blur-[2px] transition-opacity",
          "md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col",
          "border-foreground/[0.08] bg-background border-r",
          "transition-transform duration-200 ease-out",
          "md:w-[240px] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2.5 px-5">
          <Link href="/pipeline" className="flex items-center gap-2.5" onClick={close}>
            <Hexagon aria-hidden="true" strokeWidth={1.4} className="text-foreground size-[18px]" />
            <div className="leading-tight">
              <p className="font-serif text-[16px] tracking-tight">{fund.shortName}</p>
              <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
                {fund.fund}
              </p>
            </div>
          </Link>
          {/* Mobile-only close button */}
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              "border-foreground/[0.10] bg-foreground/[0.04] border",
              "text-foreground/55 hover:text-foreground md:hidden",
            )}
          >
            <X strokeWidth={1.6} className="size-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 pt-2 pb-4">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-[10px] px-3 py-2",
                      "text-[13.5px] transition-colors",
                      active
                        ? "bg-foreground/[0.06] text-foreground"
                        : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground",
                    )}
                  >
                    <Icon strokeWidth={1.6} className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "flex h-5 min-w-5 items-center justify-center px-1.5",
                          "bg-warm/15 rounded-full text-[10.5px] font-medium",
                          "tabular text-warm",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-foreground/[0.08] border-t px-3 py-3">
          <Link
            href="/settings/thesis"
            className={cn(
              "flex items-center gap-3 rounded-[10px] px-3 py-2",
              "text-foreground/65 text-[13.5px] transition-colors",
              "hover:bg-foreground/[0.04] hover:text-foreground",
            )}
          >
            <Settings2 strokeWidth={1.6} className="size-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
