import type { LeadId } from "../domain/lead/Lead";
import type { OutreachDraft } from "../domain/outreach/OutreachDraft";

export interface OutreachDraftRepository {
  save(draft: OutreachDraft): Promise<void>;
  findById(id: string): Promise<OutreachDraft | null>;
  listByLeadId(leadId: LeadId): Promise<OutreachDraft[]>;
}
