"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Mail,
  Gavel,
  Briefcase,
  BarChart3,
  Settings2,
  Hexagon,
} from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { fund } from "@/src/lib/mock/fund";

const NAV_ITEMS = [
  { href: "/pipeline", label: "Pipeline", icon: LayoutDashboard },
  { href: "/sources", label: "Sources", icon: Radar },
  { href: "/outreach", label: "Outreach", icon: Mail },
  { href: "/ic", label: "IC Calendar", icon: Gavel, badge: "2" },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col",
        "border-r border-foreground/[0.08] bg-background",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Hexagon
          aria-hidden="true"
          strokeWidth={1.4}
          className="size-[18px] text-foreground"
        />
        <div className="leading-tight">
          <p className="font-serif text-[16px] tracking-tight">
            {fund.shortName}
          </p>
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
            {fund.fund}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-4 pt-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
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
                        "rounded-full bg-warm/15 text-[10.5px] font-medium",
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

      <div className="border-t border-foreground/[0.08] px-3 py-3">
        <Link
          href="/settings/thesis"
          className={cn(
            "flex items-center gap-3 rounded-[10px] px-3 py-2",
            "text-[13.5px] text-foreground/65 transition-colors",
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
