"use client";

import { Bell, Search } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { RoleSwitcher } from "./RoleSwitcher";

export function Topbar() {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-4",
        "border-foreground/[0.08] bg-background/70 border-b",
        "px-6 backdrop-blur-[34px]",
      )}
    >
      <div className="flex flex-1 items-center">
        <button
          type="button"
          className={cn(
            "flex h-9 w-full max-w-[420px] items-center gap-2.5 rounded-full",
            "border-foreground/[0.08] bg-foreground/[0.03] border px-3.5",
            "text-foreground/55 text-[13px] transition-colors",
            "hover:bg-foreground/[0.06] hover:text-foreground/75",
          )}
        >
          <Search strokeWidth={1.6} className="size-4" />
          <span className="flex-1 text-left">Search deals, documents, citations…</span>
          <kbd
            className={cn(
              "border-foreground/[0.08] bg-foreground/[0.04] rounded-md border",
              "text-foreground/55 px-1.5 py-0.5 text-[10px] font-medium",
            )}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            "relative flex size-9 items-center justify-center rounded-full",
            "text-foreground/65 transition-colors",
            "hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          <Bell strokeWidth={1.6} className="size-4" />
          <span className={cn("absolute top-1.5 right-1.5 size-1.5 rounded-full", "bg-warm")} />
        </button>
        <RoleSwitcher />
      </div>
    </header>
  );
}
