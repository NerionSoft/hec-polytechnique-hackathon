import { notFound } from "next/navigation";
import { findPipelineDeal, listPipelineRedFlags } from "@/src/lib/data/pipeline";
import { PageHeader } from "../../../_components/PageHeader";
import { RisksFilterBar } from "./_components/RisksFilterBar";

export default async function RisksPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = await findPipelineDeal(dealId);
  if (!deal) notFound();
  const flags = await listPipelineRedFlags(dealId);

  const pending = flags.filter((f) => f.status === "pending_review").length;
  const approved = flags.filter((f) => f.status === "approved").length;

  return (
    <>
      <PageHeader
        title="Risks"
        description={`${flags.length} flags identified · ${pending} awaiting review · ${approved} approved`}
      />
      <RisksFilterBar flags={flags} />
    </>
  );
}
