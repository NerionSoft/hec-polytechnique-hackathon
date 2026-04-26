import { redirect } from "next/navigation";

export default async function DealRoot({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  redirect(`/pipeline/${dealId}/overview`);
}
