import { Settings2 } from "lucide-react";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";

export default function ThesisSettingsPage() {
  return (
    <>
      <PageHeader
        title="Investment Thesis"
        description="Configure the criteria the scoring engine uses for every incoming lead."
      />
      <EmptyState
        icon={Settings2}
        badge="Coming next"
        title="Thesis configuration"
        description="Sectors, geos, revenue range, EBITDA margin floor and growth targets — used by the scoring engine on every new lead."
      />
    </>
  );
}
