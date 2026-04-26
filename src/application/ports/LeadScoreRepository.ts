import type { LeadId } from "../domain/lead/Lead";
import type { ScoreDecision } from "../domain/lead/enums";

export interface PersistedLeadScore {
  leadId: LeadId;
  score: number;
  decision: ScoreDecision;
  reasons: string[];
  missingInfo: string[];
  thesisId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadScoreRepository {
  upsertForLead(input: {
    leadId: LeadId;
    score: number;
    decision: ScoreDecision;
    reasons: string[];
    missingInfo: string[];
    thesisId: string | null;
  }): Promise<void>;

  findByLeadId(leadId: LeadId): Promise<PersistedLeadScore | null>;
  findByLeadIds(leadIds: LeadId[]): Promise<Map<LeadId, PersistedLeadScore>>;
}
