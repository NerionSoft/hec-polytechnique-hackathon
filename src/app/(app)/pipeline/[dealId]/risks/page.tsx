import { notFound } from "next/navigation";
import { redFlagsForDeal } from "@/src/lib/mock/red-flags";
import { getDeal } from "@/src/lib/mock/deals";
import { PageHeader } from "../../../_components/PageHeader";
import { RisksFilterBar } from "./_components/RisksFilterBar";

export default async function RisksPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = getDeal(dealId);
  if (!deal) notFound();
  const flags = redFlagsForDeal(dealId);

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
