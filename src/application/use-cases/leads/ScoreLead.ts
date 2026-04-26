import type { LeadId } from "../../domain/lead/Lead";
import { LEAD_STATUS } from "../../domain/lead/enums";
import type { Clock } from "../../ports/Clock";
import type { LeadRepository } from "../../ports/LeadRepository";
import type { FundThesisRepository } from "../../ports/FundThesisRepository";
import type { LeadEnrichmentRepository } from "../../ports/LeadEnrichmentRepository";
import type { LeadScoreRepository } from "../../ports/LeadScoreRepository";
import { scoreLead, type LeadScoreResult } from "./scoringEngine";

export interface ScoreLeadCommand {
  ownerId: string;
  leadId: LeadId;
  thesisId: string;
}

export interface ScoreLeadDeps {
  leadRepo: LeadRepository;
  thesisRepo: FundThesisRepository;
  enrichmentRepo: LeadEnrichmentRepository;
  scoreRepo: LeadScoreRepository;
  clock: Clock;
}

export function makeScoreLead(deps: ScoreLeadDeps) {
  return async (cmd: ScoreLeadCommand): Promise<LeadScoreResult> => {
    const lead = await deps.leadRepo.findById(cmd.leadId);
    if (!lead) throw new Error(`Lead ${cmd.leadId} not found`);

    const thesis = await deps.thesisRepo.findById(cmd.thesisId);
    if (!thesis || thesis.ownerId !== cmd.ownerId) {
      throw new Error(`Thesis ${cmd.thesisId} not found for owner ${cmd.ownerId}`);
    }

    const enrichment = await deps.enrichmentRepo.findByLeadId(cmd.leadId);
    if (!enrichment) {
      throw new Error(
        `Lead ${cmd.leadId} has no enrichment yet. Call /api/leads/${cmd.leadId}/enrich first.`,
      );
    }

    const result = scoreLead({
      lead: {
        companyName: lead.companyName,
        country: lead.country,
        sector: lead.sector,
        estimatedRevenueEur: lead.estimatedRevenueEur,
        employeeCount: lead.employeeCount,
        founderName: lead.founderName,
      },
      enrichment: {
        businessSummary: enrichment.businessSummary,
        investmentRationale: enrichment.investmentRationale,
        concerns: enrichment.concerns,
      },
      thesis: {
        sectors: thesis.sectors,
        countries: thesis.countries,
        minRevenueEur: thesis.minRevenueEur,
        maxRevenueEur: thesis.maxRevenueEur,
        preferences: thesis.preferences,
      },
    });

    await deps.scoreRepo.upsertForLead({
      leadId: cmd.leadId,
      score: result.score,
      decision: result.decision,
      reasons: result.reasons,
      missingInfo: result.missingInfo,
      thesisId: cmd.thesisId,
    });

    await deps.leadRepo.save(lead.withStatus(LEAD_STATUS.SCORED, deps.clock.now()));
    return result;
  };
}
