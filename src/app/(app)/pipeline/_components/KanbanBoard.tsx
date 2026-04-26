import { stages, dealsByStage } from "@/src/lib/mock/deals";
import { StageColumn } from "./StageColumn";

export function KanbanBoard() {
  return (
    <div className="overflow-x-auto px-8 pb-12">
      <div className="flex min-w-max gap-3">
        {stages.map((stage) => (
          <StageColumn key={stage} stage={stage} deals={dealsByStage(stage)} />
        ))}
      </div>
    </div>
  );
}
