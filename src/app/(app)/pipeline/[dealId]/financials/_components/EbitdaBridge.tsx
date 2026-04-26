import { AlertTriangle } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { FinancialsHelios } from "@/src/lib/mock/financials";

export function EbitdaBridge({ data }: { data: FinancialsHelios["ebitdaBridge"] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((row) => {
        const widthPct = (row.value / max) * 100;
        const isTotal = row.type === "total";
        const isWarning = row.type === "warning";
        return (
          <div key={row.label} className="flex items-center gap-3">
            <div className="w-[160px] shrink-0">
              <p
                className={cn(
                  "text-[12px]",
                  isTotal ? "text-foreground font-medium" : "text-foreground/75",
                )}
              >
                {row.label}
                {isWarning && (
                  <AlertTriangle strokeWidth={1.8} className="text-warm ml-1 inline size-3" />
                )}
              </p>
              {row.note && <p className="text-foreground/45 mt-0.5 text-[10.5px]">{row.note}</p>}
            </div>
            <div className="bg-foreground/[0.04] relative h-6 flex-1 rounded-[6px]">
              <div
                className={cn(
                  "h-full rounded-[6px] transition-all",
                  isTotal && "bg-foreground/85",
                  row.type === "base" && "bg-accent/70",
                  row.type === "addition" && "bg-foreground/30",
                  isWarning && "bg-warm/65",
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <p
              className={cn(
                "tabular w-14 text-right text-[12.5px]",
                isTotal ? "text-foreground font-medium" : "text-foreground/75",
              )}
            >
              {row.type === "addition" || row.type === "warning" ? "+" : ""}€{row.value.toFixed(1)}M
            </p>
          </div>
        );
      })}
    </div>
  );
}
