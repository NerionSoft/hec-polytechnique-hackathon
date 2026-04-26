import { Mail } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { EmptyState } from "../_components/EmptyState";

export default function OutreachPage() {
  return (
    <>
      <PageHeader
        title="Outreach"
        description="Personalised intros, replies and meeting scheduling."
      />
      <EmptyState
        icon={Mail}
        badge="Coming next"
        title="Conversational mailbox"
        description="Sequenced outreach with AI-suggested replies. Wired to your CRM. Live for IberiaPay SL — currently in warm intro stage."
      />
    </>
  );
}
