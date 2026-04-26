import { notFound } from "next/navigation";
import { getDeal } from "@/src/lib/mock/deals";
import { redFlagsForDeal } from "@/src/lib/mock/red-flags";
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
  const deal = getDeal(dealId);
  if (!deal) notFound();

  const redFlagCount = redFlagsForDeal(dealId).length;

  return (
    <>
      <DealHeader deal={deal} />
      <DealTabs dealId={deal.id} currentStage={deal.stage} redFlagCount={redFlagCount} />
      {children}
      <CitationDrawer />
    </>
  );
}
