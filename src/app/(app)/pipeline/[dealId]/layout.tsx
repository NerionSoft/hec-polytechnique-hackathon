import { notFound } from "next/navigation";
import {
  findPipelineDeal,
  findPipelineEntityKind,
  listPipelineRedFlags,
} from "@/src/lib/data/pipeline";
import { DealHeader } from "./_components/DealHeader";
import { DealTabs } from "./_components/DealTabs";
import { CitationDrawer } from "./_components/CitationDrawer";

export default async function DealLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const [deal, kind, redFlags] = await Promise.all([
    findPipelineDeal(dealId),
    findPipelineEntityKind(dealId),
    listPipelineRedFlags(dealId),
  ]);
  if (!deal) notFound();

  return (
    <>
      <DealHeader deal={deal} entityKind={kind ?? "mock"} sourceId={dealId} />
      <DealTabs dealId={deal.id} currentStage={deal.stage} redFlagCount={redFlags.length} />
      {children}
      <CitationDrawer />
    </>
  );
}
