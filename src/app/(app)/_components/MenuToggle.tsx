"use client";

import { Menu } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { useSidebarStore } from "@/src/lib/stores/sidebar-store";

export function MenuToggle() {
  const open = useSidebarStore((s) => s.open);
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open menu"
      className={cn(
        "flex size-9 items-center justify-center rounded-full",
        "border-foreground/[0.10] bg-foreground/[0.04] border",
        "text-foreground/65 hover:bg-foreground/[0.08] hover:text-foreground",
        "md:hidden",
      )}
    >
      <Menu strokeWidth={1.6} className="size-4" />
    </button>
  );
}
