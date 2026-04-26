"use client";

import { useState } from "react";
import { LayoutGrid, Table2, BarChart3 } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

const VIEWS = [
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
  { id: "table", label: "Table", icon: Table2 },
  { id: "funnel", label: "Funnel", icon: BarChart3 },
] as const;

export function ViewToggle() {
  const [active, setActive] = useState<(typeof VIEWS)[number]["id"]>("kanban");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full",
        "border border-foreground/[0.08] bg-foreground/[0.02] p-0.5",
      )}
    >
      {VIEWS.map((v) => {
        const isActive = v.id === active;
        const Icon = v.icon;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5",
              "text-[12px] font-medium transition-colors",
              isActive
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/55 hover:text-foreground/85",
            )}
          >
            <Icon strokeWidth={1.6} className="size-3.5" />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
