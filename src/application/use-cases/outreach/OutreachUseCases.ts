import { OutreachDraft } from "../../domain/outreach/OutreachDraft";
import type { LeadId } from "../../domain/lead/Lead";
import type { LeadRepository } from "../../ports/LeadRepository";
import type { LeadEnrichmentRepository } from "../../ports/LeadEnrichmentRepository";
import type { FundThesisRepository } from "../../ports/FundThesisRepository";
import type { OutreachDrafter } from "../../ports/OutreachDrafter";
import type { OutreachDraftRepository } from "../../ports/OutreachDraftRepository";
import type { Clock } from "../../ports/Clock";
import type { IdGenerator } from "../../ports/IdGenerator";
import { LEAD_STATUS } from "../../domain/lead/enums";

export interface GenerateOutreachCommand {
  ownerId: string;
  leadId: LeadId;
  thesisId: string;
  recipient?: string | null;
  fund?: { senderName: string | null; fundName: string | null };
}

export function makeGenerateOutreachDraft(deps: {
  leadRepo: LeadRepository;
  thesisRepo: FundThesisRepository;
  enrichmentRepo: LeadEnrichmentRepository;
  outreachRepo: OutreachDraftRepository;
  drafter: OutreachDrafter;
  clock: Clock;
  idGen: IdGenerator;
}) {
  return async (cmd: GenerateOutreachCommand): Promise<OutreachDraft> => {
    const lead = await deps.leadRepo.findById(cmd.leadId);
    if (!lead) throw new Error(`Lead ${cmd.leadId} not found`);
    const thesis = await deps.thesisRepo.findById(cmd.thesisId);
    if (!thesis || thesis.ownerId !== cmd.ownerId) {
      throw new Error(`Thesis ${cmd.thesisId} not found for owner`);
    }
    if (lead.thesisId && lead.thesisId !== thesis.id) {
      // Cross-thesis outreach is allowed but logged via thesisId stamped on the draft.
    }
    const enrichment = await deps.enrichmentRepo.findByLeadId(cmd.leadId);
    if (!enrichment) {
      throw new Error(`Lead ${cmd.leadId} has no enrichment yet — run enrich first`);
    }

    const j = lead.toJSON();
    const t = thesis.toJSON();
    const out = await deps.drafter.draft({
      lead: {
        companyName: j.companyName,
        country: j.country,
        sector: j.sector,
        website: j.website,
        founderName: j.founderName,
      },
      thesis: {
        name: t.name,
        sectors: t.sectors,
        countries: t.countries,
        minRevenueEur: t.minRevenueEur,
        maxRevenueEur: t.maxRevenueEur,
      },
      enrichment: {
        businessSummary: enrichment.businessSummary,
        investmentRationale: enrichment.investmentRationale,
        suggestedOutreachAngle: enrichment.suggestedOutreachAngle ?? "",
      },
      fund: cmd.fund ?? { senderName: null, fundName: null },
    });

    const now = deps.clock.now();
    const draft = OutreachDraft.create({
      id: deps.idGen.newId(),
      leadId: cmd.leadId,
      thesisId: thesis.id,
      recipient: cmd.recipient ?? null,
      subject: out.subject,
      body: out.body,
      model: out.model,
      promptHash: out.promptHash,
      promptTokens: out.promptTokens,
      completionTokens: out.completionTokens,
      now,
    });
    await deps.outreachRepo.save(draft);
    return draft;
  };
}

export interface UpdateOutreachCommand {
  ownerId: string;
  draftId: string;
  patch: { subject?: string; body?: string; recipient?: string | null };
}

export function makeUpdateOutreachDraft(deps: {
  outreachRepo: OutreachDraftRepository;
  leadRepo: LeadRepository;
  thesisRepo: FundThesisRepository;
  clock: Clock;
}) {
  return async (cmd: UpdateOutreachCommand): Promise<OutreachDraft> => {
    const draft = await loadOwned(cmd.draftId, cmd.ownerId, deps);
    const updated = draft.withEdits(cmd.patch, deps.clock.now());
    await deps.outreachRepo.save(updated);
    return updated;
  };
}

export interface ApproveOutreachCommand {
  ownerId: string;
  draftId: string;
}

export function makeApproveOutreachDraft(deps: {
  outreachRepo: OutreachDraftRepository;
  leadRepo: LeadRepository;
  thesisRepo: FundThesisRepository;
  clock: Clock;
}) {
  return async (cmd: ApproveOutreachCommand): Promise<OutreachDraft> => {
    const draft = await loadOwned(cmd.draftId, cmd.ownerId, deps);
    const updated = draft.withApproval(deps.clock.now());
    await deps.outreachRepo.save(updated);
    return updated;
  };
}

export interface MarkSentCommand {
  ownerId: string;
  draftId: string;
}

export function makeMarkOutreachSent(deps: {
  outreachRepo: OutreachDraftRepository;
  leadRepo: LeadRepository;
  thesisRepo: FundThesisRepository;
  clock: Clock;
}) {
  // No SMTP integration — flipping to SENT is a manual audit stamp.
  // It also bumps the lead's status to CONTACTED so the workflow visibly advances.
  return async (cmd: MarkSentCommand): Promise<OutreachDraft> => {
    const draft = await loadOwned(cmd.draftId, cmd.ownerId, deps);
    const now = deps.clock.now();
    const sent = draft.withSent(now);
    await deps.outreachRepo.save(sent);
    const lead = await deps.leadRepo.findById(draft.leadId);
    if (lead && lead.status !== LEAD_STATUS.CONTACTED) {
      await deps.leadRepo.save(lead.withStatus(LEAD_STATUS.CONTACTED, now));
    }
    return sent;
  };
}

export interface ListOutreachCommand {
  ownerId: string;
  leadId: LeadId;
}

export function makeListOutreachDrafts(deps: {
  outreachRepo: OutreachDraftRepository;
  leadRepo: LeadRepository;
  thesisRepo: FundThesisRepository;
}) {
  return async (cmd: ListOutreachCommand): Promise<OutreachDraft[]> => {
    const lead = await deps.leadRepo.findById(cmd.leadId);
    if (!lead) return [];
    if (!lead.thesisId) return [];
    const thesis = await deps.thesisRepo.findById(lead.thesisId);
    if (!thesis || thesis.ownerId !== cmd.ownerId) return [];
    return deps.outreachRepo.listByLeadId(cmd.leadId);
  };
}

async function loadOwned(
  draftId: string,
  ownerId: string,
  deps: {
    outreachRepo: OutreachDraftRepository;
    leadRepo: LeadRepository;
    thesisRepo: FundThesisRepository;
  },
): Promise<OutreachDraft> {
  const draft = await deps.outreachRepo.findById(draftId);
  if (!draft) throw new Error(`OutreachDraft ${draftId} not found`);
  const lead = await deps.leadRepo.findById(draft.leadId);
  if (!lead || !lead.thesisId) throw new Error("Lead missing for draft");
  const thesis = await deps.thesisRepo.findById(lead.thesisId);
  if (!thesis || thesis.ownerId !== ownerId) {
    throw new Error(`OutreachDraft ${draftId} not found for owner`);
  }
  return draft;
}
