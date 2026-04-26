import { ArrowUpRight } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { FinancialsHelios } from "@/src/lib/mock/financials";

export function WorkingCapital({ data }: { data: FinancialsHelios["workingCapital"] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-foreground/55 grid grid-cols-3 gap-2 text-[11px]">
        <span>Period</span>
        <span className="text-right">DSO (days)</span>
        <span className="text-right">DPO / DIO</span>
      </div>
      {data.map((row, i) => {
        const prev = i > 0 ? data[i - 1] : null;
        const dsoDelta = prev ? row.dso - prev.dso : 0;
        return (
          <div
            key={row.period}
            className={cn(
              "border-foreground/[0.06] grid grid-cols-3 items-baseline gap-2 border-t pt-3",
              "first:border-0 first:pt-0",
            )}
          >
            <span className="text-foreground/85 text-[12.5px]">{row.period}</span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span
                className={cn(
                  "tabular text-[14px] font-medium",
                  row.dso >= 60 ? "text-warm" : "text-foreground",
                )}
              >
                {row.dso}d
              </span>
              {dsoDelta !== 0 && (
                <span
                  className={cn(
                    "tabular text-[10.5px]",
                    dsoDelta > 0 ? "text-warm" : "text-sev-low",
                  )}
                >
                  {dsoDelta > 0 ? `+${dsoDelta}` : dsoDelta}
                </span>
              )}
            </div>
            <span className="tabular text-foreground/55 text-right text-[12px]">
              {row.dpo} / {row.dio}
            </span>
          </div>
        );
      })}
      <p className="text-warm text-[11px]">
        <ArrowUpRight strokeWidth={1.6} className="mr-1 inline size-3" />
        DSO +21d over 2 years · €2M expected WC outflow if trend continues
      </p>
    </div>
  );
}
