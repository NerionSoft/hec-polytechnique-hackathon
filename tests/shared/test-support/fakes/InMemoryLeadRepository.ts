import { Lead, type LeadId } from "@/src/application/domain/lead/Lead";
import type { LeadRepository } from "@/src/application/ports/LeadRepository";
import type { ListLeadsQuery } from "@/src/application/ports/types";

export class InMemoryLeadRepository implements LeadRepository {
  private readonly leads = new Map<LeadId, Lead>();
  // Spy: every saveMany invocation captured for tests.
  readonly saveManyCalls: Lead[][] = [];
  readonly saveCalls: Lead[] = [];

  async save(lead: Lead): Promise<void> {
    this.saveCalls.push(lead);
    this.leads.set(lead.id, Lead.fromPersistence(lead.toJSON()));
  }

  async saveMany(leads: Lead[]): Promise<void> {
    this.saveManyCalls.push([...leads]);
    for (const lead of leads) {
      this.leads.set(lead.id, Lead.fromPersistence(lead.toJSON()));
    }
  }

  async findById(id: LeadId): Promise<Lead | null> {
    const found = this.leads.get(id);
    return found ? Lead.fromPersistence(found.toJSON()) : null;
  }

  async list(query: ListLeadsQuery): Promise<Lead[]> {
    let rows = Array.from(this.leads.values()).map((l) => l.toJSON());
    rows = rows.filter((r) => {
      if (query.status && r.status !== query.status) return false;
      if (query.thesisId && r.thesisId !== query.thesisId) return false;
      return true;
    });
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const offset = query.offset ?? 0;
    const limit = query.limit ?? rows.length;
    return rows.slice(offset, offset + limit).map((r) => Lead.fromPersistence(r));
  }

  async countByThesis(thesisId: string): Promise<number> {
    let n = 0;
    for (const lead of this.leads.values()) {
      if (lead.thesisId === thesisId) n += 1;
    }
    return n;
  }

  // ── test helpers ──
  count(): number {
    return this.leads.size;
  }
  clear(): void {
    this.leads.clear();
    this.saveManyCalls.length = 0;
    this.saveCalls.length = 0;
  }
  seed(leadOrLeads: Lead | Lead[]): void {
    const arr = Array.isArray(leadOrLeads) ? leadOrLeads : [leadOrLeads];
    for (const lead of arr) {
      this.leads.set(lead.id, Lead.fromPersistence(lead.toJSON()));
    }
  }
}
