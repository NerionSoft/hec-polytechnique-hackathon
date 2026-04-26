import { Radar } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        title="Lead Sources"
        description="Targets ingested from databases, brokers and inbound channels."
      />
      <EmptyState
        icon={Radar}
        badge="Coming next"
        title="Lead intelligence pool"
        description="The sources table and per-lead score breakdown ship in the next iteration. Pipeline already includes 47 enriched leads this quarter."
      />
    </>
  );
}
