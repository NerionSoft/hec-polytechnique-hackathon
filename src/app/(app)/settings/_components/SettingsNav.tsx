"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/presentation/lib/cn";

const ITEMS = [
  { href: "/settings/thesis", label: "Investment thesis" },
  { href: "/settings/team", label: "Team & permissions" },
  { href: "/settings/sources", label: "Sources & scrapers" },
  { href: "/settings/audit", label: "Audit log" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-[10px] px-3 py-2 text-[13px] transition-colors",
              active
                ? "bg-foreground/[0.06] text-foreground"
                : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
