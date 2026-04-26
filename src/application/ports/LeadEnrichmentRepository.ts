import type { LeadId } from "../domain/lead/Lead";
import type { EnrichmentResult } from "./types";

export interface PersistedLeadEnrichment extends EnrichmentResult {
  leadId: LeadId;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadEnrichmentRepository {
  upsertForLead(leadId: LeadId, result: EnrichmentResult): Promise<void>;
  findByLeadId(leadId: LeadId): Promise<PersistedLeadEnrichment | null>;
  findByLeadIds(leadIds: LeadId[]): Promise<Map<LeadId, PersistedLeadEnrichment>>;
}
