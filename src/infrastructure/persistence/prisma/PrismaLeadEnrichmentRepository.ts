import type { PrismaClient } from "@prisma/client";
import type {
  LeadEnrichmentRepository,
  PersistedLeadEnrichment,
} from "@/src/application/ports/LeadEnrichmentRepository";
import type { EnrichmentResult } from "@/src/application/ports/types";
import type { LeadId } from "@/src/application/domain/lead/Lead";
import type { ScoreDecision } from "@/src/application/domain/lead/enums";

export class PrismaLeadEnrichmentRepository implements LeadEnrichmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertForLead(leadId: LeadId, result: EnrichmentResult): Promise<void> {
    const data = {
      businessSummary: result.businessSummary,
      investmentRationale: result.investmentRationale,
      concerns: result.concerns,
      suggestedOutreachAngle: result.suggestedOutreachAngle,
      peFitScore: result.peFitScore,
      peFitDecision: result.peFitDecision,
      reasons: result.reasons,
      missingInfo: result.missingInfo,
      enrichmentModel: result.model,
      promptHash: result.promptHash,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    };
    await this.prisma.leadEnrichment.upsert({
      where: { leadId },
      create: { leadId, ...data },
      update: data,
    });
  }

  async findByLeadId(leadId: LeadId): Promise<PersistedLeadEnrichment | null> {
    const row = await this.prisma.leadEnrichment.findUnique({ where: { leadId } });
    return row ? this.toPersisted(row) : null;
  }

  async findByLeadIds(leadIds: LeadId[]): Promise<Map<LeadId, PersistedLeadEnrichment>> {
    if (leadIds.length === 0) return new Map();
    const rows = await this.prisma.leadEnrichment.findMany({
      where: { leadId: { in: leadIds } },
    });
    const map = new Map<LeadId, PersistedLeadEnrichment>();
    for (const row of rows) {
      map.set(row.leadId as LeadId, this.toPersisted(row));
    }
    return map;
  }

  private toPersisted(row: {
    leadId: string;
    businessSummary: string;
    investmentRationale: string[];
    concerns: string[];
    suggestedOutreachAngle: string | null;
    peFitScore: number;
    peFitDecision: string;
    reasons: string[];
    missingInfo: string[];
    enrichmentModel: string;
    promptHash: string;
    promptTokens: number | null;
    completionTokens: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): PersistedLeadEnrichment {
    return {
      leadId: row.leadId as LeadId,
      businessSummary: row.businessSummary,
      investmentRationale: row.investmentRationale,
      concerns: row.concerns,
      suggestedOutreachAngle: row.suggestedOutreachAngle ?? "",
      peFitScore: row.peFitScore,
      peFitDecision: row.peFitDecision as ScoreDecision,
      reasons: row.reasons,
      missingInfo: row.missingInfo,
      model: row.enrichmentModel,
      promptHash: row.promptHash,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
