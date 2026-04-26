import type { LeadId } from "@/src/application/domain/lead/Lead";
import type { ScoreDecision } from "@/src/application/domain/lead/enums";
import type {
  LeadScoreRepository,
  PersistedLeadScore,
} from "@/src/application/ports/LeadScoreRepository";

export class InMemoryLeadScoreRepository implements LeadScoreRepository {
  private readonly rows = new Map<LeadId, PersistedLeadScore>();

  async upsertForLead(input: {
    leadId: LeadId;
    score: number;
    decision: ScoreDecision;
    reasons: string[];
    missingInfo: string[];
    thesisId: string | null;
  }): Promise<void> {
    const existing = this.rows.get(input.leadId);
    const now = new Date();
    this.rows.set(input.leadId, {
      leadId: input.leadId,
      score: input.score,
      decision: input.decision,
      reasons: input.reasons,
      missingInfo: input.missingInfo,
      thesisId: input.thesisId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async findByLeadId(leadId: LeadId): Promise<PersistedLeadScore | null> {
    return this.rows.get(leadId) ?? null;
  }

  async findByLeadIds(leadIds: LeadId[]): Promise<Map<LeadId, PersistedLeadScore>> {
    const out = new Map<LeadId, PersistedLeadScore>();
    for (const id of leadIds) {
      const row = this.rows.get(id);
      if (row) out.set(id, row);
    }
    return out;
  }

  // ── test helpers ──
  count(): number {
    return this.rows.size;
  }
  clear(): void {
    this.rows.clear();
  }
}
