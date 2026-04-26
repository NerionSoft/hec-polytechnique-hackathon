import { Sparkles } from "lucide-react";
import { PageHeader } from "../../../_components/PageHeader";
import { EmptyState } from "../../../_components/EmptyState";

export default function EnrichmentPage() {
  return (
    <>
      <PageHeader
        title="Enrichment"
        description="Firmographics, scoring breakdown and signal layers from the lead intelligence pool."
      />
      <EmptyState
        icon={Sparkles}
        badge="Coming next"
        title="Enrichment dashboard"
        description="Sector / size / growth / geo score breakdown, ownership map, press coverage and Glassdoor signals."
      />
    </>
  );
}
