import type { Lead, LeadId } from "../../domain/lead/Lead";
import type { LeadRepository } from "../../ports/LeadRepository";

export function makeGetLeadById(deps: { leadRepo: LeadRepository }) {
  return async (id: LeadId): Promise<Lead | null> => deps.leadRepo.findById(id);
}
