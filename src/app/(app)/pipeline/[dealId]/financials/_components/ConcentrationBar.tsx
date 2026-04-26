import { AlertTriangle } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { FinancialsHelios } from "@/src/lib/mock/financials";

export function ConcentrationBar({
  data,
}: {
  data: FinancialsHelios["customerConcentration"];
}) {
  const max = Math.max(...data.map((d) => d.share));
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((c) => {
        const widthPct = (c.share / max) * 100;
        return (
          <div key={c.name} className="flex items-center gap-3">
            <div className="flex w-[140px] shrink-0 items-center gap-1.5">
              <p
                className={cn(
                  "truncate text-[12px]",
                  c.flag ? "text-warm" : "text-foreground/75",
                )}
              >
                {c.name}
              </p>
              {c.flag && (
                <AlertTriangle strokeWidth={1.8} className="size-3 shrink-0 text-warm" />
              )}
            </div>
            <div className="relative h-5 flex-1 rounded-[6px] bg-foreground/[0.04]">
              <div
                className={cn(
                  "h-full rounded-[6px]",
                  c.flag ? "bg-warm/65" : "bg-foreground/30",
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <p className="w-12 text-right tabular text-[12.5px] text-foreground/75">
              {(c.share * 100).toFixed(0)}%
            </p>
          </div>
        );
      })}
      <p className="mt-1 text-[11px] text-foreground/45">
        HHI 0.41 · top-3 = 64% of revenue
      </p>
    </div>
  );
}
