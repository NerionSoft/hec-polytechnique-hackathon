import { cn } from "@/src/presentation/lib/cn";
import type { Deal, Stage } from "@/src/lib/mock/deals";
import { stageLabels } from "@/src/lib/mock/deals";
import { DealCard } from "./DealCard";

export function StageColumn({
  stage,
  deals,
}: {
  stage: Stage;
  deals: Deal[];
}) {
  return (
    <div
      className={cn(
        "flex w-[260px] shrink-0 flex-col rounded-[18px]",
        "border border-foreground/[0.08] bg-foreground/[0.02]",
      )}
    >
      <div className="flex items-center justify-between border-b border-foreground/[0.08] px-3.5 py-2.5">
        <p className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-foreground/65">
          {stageLabels[stage]}
        </p>
        <span
          className={cn(
            "rounded-full bg-foreground/[0.06] px-1.5 py-0.5",
            "text-[10.5px] tabular text-foreground/55",
          )}
        >
          {deals.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {deals.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 min-h-[120px] items-center justify-center",
              "rounded-[12px] border border-dashed border-foreground/[0.08]",
              "text-[11px] text-foreground/35",
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
