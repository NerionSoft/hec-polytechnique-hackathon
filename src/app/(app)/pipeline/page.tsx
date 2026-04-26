import { PageHeader } from "../_components/PageHeader";
import { QuarterStrip } from "./_components/QuarterStrip";
import { FilterBar } from "./_components/FilterBar";
import { KanbanBoard } from "./_components/KanbanBoard";

export default function PipelinePage() {
  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Every deal across the funnel — from sourcing to IC decision."
      />
      <QuarterStrip />
      <FilterBar />
      <KanbanBoard />
    </>
  );
}
