import { History } from "lucide-react";
import { PageHeader } from "../../../_components/PageHeader";
import { EmptyState } from "../../../_components/EmptyState";

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Every AI inference and human override, time-stamped."
      />
      <EmptyState
        icon={History}
        badge="Coming next"
        title="Compliance trail"
        description="Exportable CSV of every action taken on this deal — for LP and regulatory reporting."
      />
    </>
  );
}
