"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radar, Gavel, Settings2, Hexagon } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { fund } from "@/src/lib/mock/fund";

const NAV_ITEMS = [
  { href: "/pipeline", label: "Pipeline", icon: LayoutDashboard },
  { href: "/sources", label: "Sources", icon: Radar },
  { href: "/ic", label: "IC Calendar", icon: Gavel, badge: "2" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col",
        "border-foreground/[0.08] bg-background border-r",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Hexagon aria-hidden="true" strokeWidth={1.4} className="text-foreground size-[18px]" />
        <div className="leading-tight">
          <p className="font-serif text-[16px] tracking-tight">{fund.shortName}</p>
          <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
            {fund.fund}
          </p>
        </div>
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
  );
}
