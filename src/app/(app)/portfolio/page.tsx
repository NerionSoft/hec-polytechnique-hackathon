import { Briefcase } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Companies under management."
      />
      <EmptyState
        icon={Briefcase}
        badge="Roadmap"
        title="Portfolio monitoring"
        description="Once a deal is decided, monitor KPIs, board materials and value-creation plan from a single view."
      />
    </>
  );
}
