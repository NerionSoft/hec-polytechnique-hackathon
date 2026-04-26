import { cn } from "@/src/presentation/lib/cn";
import type { Deal, Stage } from "@/src/lib/mock/deals";
import { stageLabels } from "@/src/lib/mock/deals";
import { DealCard } from "./DealCard";

export function StageColumn({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  return (
    <div
      className={cn(
        "flex w-[260px] shrink-0 flex-col rounded-[18px]",
        "border-foreground/[0.08] bg-foreground/[0.02] border",
      )}
    >
      <div className="border-foreground/[0.08] flex items-center justify-between border-b px-3.5 py-2.5">
        <p className="text-foreground/65 text-[11.5px] font-medium tracking-[0.12em] uppercase">
          {stageLabels[stage]}
        </p>
        <span
          className={cn(
            "bg-foreground/[0.06] rounded-full px-1.5 py-0.5",
            "tabular text-foreground/55 text-[10.5px]",
          )}
        >
          {deals.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {deals.length === 0 ? (
          <div
            className={cn(
              "flex min-h-[120px] flex-1 items-center justify-center",
              "border-foreground/[0.08] rounded-[12px] border border-dashed",
              "text-foreground/35 text-[11px]",
            )}
          >
            No deals
          </div>
        ) : (
          deals.map((d) => <DealCard key={d.id} deal={d} />)
        )}
      </div>
    </div>
  );
}
