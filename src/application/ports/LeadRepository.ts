import type { Lead, LeadId } from "../domain/lead/Lead";
import type { ListLeadsQuery } from "./types";

export interface LeadRepository {
  save(lead: Lead): Promise<void>;
  saveMany(leads: Lead[]): Promise<void>;
  findById(id: LeadId): Promise<Lead | null>;
  list(query: ListLeadsQuery): Promise<Lead[]>;
  countByThesis(thesisId: string): Promise<number>;
}
