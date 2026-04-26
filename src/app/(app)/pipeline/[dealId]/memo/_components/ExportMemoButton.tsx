"use client";

import { Download } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

export function ExportMemoButton({ dealId }: { dealId: string }) {
  function handleExport() {
    window.open(`/print/memo/${dealId}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className={cn(
        "bg-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
        "text-background text-[12px] font-medium hover:opacity-90",
      )}
    >
      <Download strokeWidth={1.6} className="size-3.5" />
      Export PDF
    </button>
  );
}
