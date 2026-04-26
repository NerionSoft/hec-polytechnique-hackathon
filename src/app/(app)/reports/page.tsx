import { BarChart3 } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Fund-wide analytics and benchmarking."
      />
      <EmptyState
        icon={BarChart3}
        badge="Roadmap"
        title="Quarterly fund reports"
        description="Pipeline conversion, sector diversification, days-saved analytics and IC win-rate."
      />
    </>
  );
}
