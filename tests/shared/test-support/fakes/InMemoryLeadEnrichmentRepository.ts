import type { LeadId } from "@/src/application/domain/lead/Lead";
import type {
  LeadEnrichmentRepository,
  PersistedLeadEnrichment,
} from "@/src/application/ports/LeadEnrichmentRepository";
import type { EnrichmentResult } from "@/src/application/ports/types";

export class InMemoryLeadEnrichmentRepository implements LeadEnrichmentRepository {
  private readonly rows = new Map<LeadId, PersistedLeadEnrichment>();

  async upsertForLead(leadId: LeadId, result: EnrichmentResult): Promise<void> {
    const existing = this.rows.get(leadId);
    const now = new Date();
    this.rows.set(leadId, {
      ...result,
      leadId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async findByLeadId(leadId: LeadId): Promise<PersistedLeadEnrichment | null> {
    return this.rows.get(leadId) ?? null;
  }

  async findByLeadIds(leadIds: LeadId[]): Promise<Map<LeadId, PersistedLeadEnrichment>> {
    const out = new Map<LeadId, PersistedLeadEnrichment>();
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
  seed(leadId: LeadId, result: EnrichmentResult): void {
    const now = new Date();
    this.rows.set(leadId, { ...result, leadId, createdAt: now, updatedAt: now });
  }
}
