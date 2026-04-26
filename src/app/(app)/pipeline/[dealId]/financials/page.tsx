import { TrendingUp } from "lucide-react";
import { PageHeader } from "../../../_components/PageHeader";
import { EmptyState } from "../../../_components/EmptyState";

export default function FinancialsPage() {
  return (
    <>
      <PageHeader
        title="Financials"
        description="Revenue, EBITDA bridge, working capital and customer concentration."
      />
      <EmptyState
        icon={TrendingUp}
        badge="Coming next"
        title="Financial workspace"
        description="KPI tiles, multi-year trend, EBITDA bridge waterfall, customer concentration and cohort retention — all wired to source citations."
      />
    </>
  );
}
