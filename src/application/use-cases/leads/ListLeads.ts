import type { Lead } from "../../domain/lead/Lead";
import type { LeadStatus } from "../../domain/lead/enums";
import type { LeadRepository } from "../../ports/LeadRepository";

export interface ListLeadsQuery {
  ownerId: string;
  status?: LeadStatus;
  thesisId?: string;
  limit?: number;
  offset?: number;
}

export function makeListLeads(deps: { leadRepo: LeadRepository }) {
  return async (q: ListLeadsQuery): Promise<Lead[]> => deps.leadRepo.list(q);
}
