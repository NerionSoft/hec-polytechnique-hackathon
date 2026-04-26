import type { Stage } from "@/src/lib/mock/deals";
import { listPipelineDeals } from "@/src/lib/data/pipeline";
import { StageColumn } from "./StageColumn";

// Pipeline kanban only shows real Deal stages. Lead-only stages
// (sourced/enriched/scored/contacted/engaged) live on /sources as an inbox.
const KANBAN_STAGES: Stage[] = ["in_dd", "ic_ready", "decided"];

export async function KanbanBoard() {
  const deals = await listPipelineDeals();

  return (
    <div className="overflow-x-auto px-8 pb-12">
      <div className="flex min-w-max gap-3">
        {KANBAN_STAGES.map((stage) => (
          <StageColumn key={stage} stage={stage} deals={deals.filter((d) => d.stage === stage)} />
        ))}
      </div>
    </div>
  );
}
