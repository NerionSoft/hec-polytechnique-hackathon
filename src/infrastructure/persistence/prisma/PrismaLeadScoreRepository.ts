import type { PrismaClient } from "@prisma/client";
import type {
  LeadScoreRepository,
  PersistedLeadScore,
} from "@/src/application/ports/LeadScoreRepository";
import type { LeadId } from "@/src/application/domain/lead/Lead";
import type { ScoreDecision } from "@/src/application/domain/lead/enums";

export class PrismaLeadScoreRepository implements LeadScoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertForLead(input: {
    leadId: LeadId;
    score: number;
    decision: ScoreDecision;
    reasons: string[];
    missingInfo: string[];
    thesisId: string | null;
  }): Promise<void> {
    const data = {
      score: input.score,
      decision: input.decision,
      reasons: input.reasons,
      missingInfo: input.missingInfo,
      thesisId: input.thesisId,
    };
    await this.prisma.leadScore.upsert({
      where: { leadId: input.leadId },
      create: { leadId: input.leadId, ...data },
      update: data,
    });
  }

  async findByLeadId(leadId: LeadId): Promise<PersistedLeadScore | null> {
    const row = await this.prisma.leadScore.findUnique({ where: { leadId } });
    return row ? this.toPersisted(row) : null;
  }

  async findByLeadIds(leadIds: LeadId[]): Promise<Map<LeadId, PersistedLeadScore>> {
    if (leadIds.length === 0) return new Map();
    const rows = await this.prisma.leadScore.findMany({ where: { leadId: { in: leadIds } } });
    const map = new Map<LeadId, PersistedLeadScore>();
    for (const row of rows) {
      map.set(row.leadId as LeadId, this.toPersisted(row));
    }
    return map;
  }

  private toPersisted(row: {
    leadId: string;
    score: number;
    decision: string;
    reasons: string[];
    missingInfo: string[];
    thesisId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PersistedLeadScore {
    return {
      leadId: row.leadId as LeadId,
      score: row.score,
      decision: row.decision as ScoreDecision,
      reasons: row.reasons,
      missingInfo: row.missingInfo,
      thesisId: row.thesisId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
