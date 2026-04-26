"use client";

import { cn } from "@/src/presentation/lib/cn";
import { useDrawerStore } from "@/src/lib/stores/drawer-store";

export function CitationLink({
  id,
  label,
  className,
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  const open = useDrawerStore((s) => s.open);

  return (
    <button
      type="button"
      onClick={() => open(id)}
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-px",
        "bg-accent/10 text-[10.5px] font-medium text-accent",
        "tabular transition-colors hover:bg-accent/20",
        className,
      )}
    >
      [{label ?? id}]
    </button>
  );
}
