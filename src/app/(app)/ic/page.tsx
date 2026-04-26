import { Gavel } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";

export default function IcPage() {
  return (
    <>
      <PageHeader
        title="Investment Committee"
        description="Upcoming meetings and decided items."
      />
      <EmptyState
        icon={Gavel}
        badge="Coming next"
        title="IC calendar"
        description="Two upcoming committees: NordicCare ApS (May 4) and Helios AgriTech (May 18)."
      />
    </>
  );
}
