import type { LeadId } from "../../domain/lead/Lead";
import { OutreachDraft } from "../../domain/outreach/OutreachDraft";
import type { OutreachDraftRepository } from "../../ports/OutreachDraftRepository";

export class InMemoryOutreachDraftRepository implements OutreachDraftRepository {
  private readonly rows = new Map<string, OutreachDraft>();
  readonly saveCalls: OutreachDraft[] = [];

  async save(draft: OutreachDraft): Promise<void> {
    this.rows.set(draft.id, draft);
    this.saveCalls.push(draft);
  }

  async findById(id: string): Promise<OutreachDraft | null> {
    return this.rows.get(id) ?? null;
  }

  async listByLeadId(leadId: LeadId): Promise<OutreachDraft[]> {
    return [...this.rows.values()]
      .filter((d) => d.leadId === leadId)
      .sort((a, b) => b.toJSON().createdAt.getTime() - a.toJSON().createdAt.getTime());
  }

  // ── test helpers ──
  count(): number {
    return this.rows.size;
  }
  clear(): void {
    this.rows.clear();
    this.saveCalls.length = 0;
  }
  seed(d: OutreachDraft): void {
    this.rows.set(d.id, d);
  }
}
