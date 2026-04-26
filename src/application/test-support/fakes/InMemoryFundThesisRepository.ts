import { FundThesis } from "../../domain/thesis/FundThesis";
import type { FundThesisRepository } from "../../ports/FundThesisRepository";

export class InMemoryFundThesisRepository implements FundThesisRepository {
  private readonly theses = new Map<string, FundThesis>();
  readonly saveCalls: FundThesis[] = [];

  async save(thesis: FundThesis): Promise<void> {
    this.saveCalls.push(thesis);
    this.theses.set(thesis.id, FundThesis.fromPersistence(thesis.toJSON()));
  }

  async findById(id: string): Promise<FundThesis | null> {
    const found = this.theses.get(id);
    return found ? FundThesis.fromPersistence(found.toJSON()) : null;
  }

  async listByOwner(ownerId: string): Promise<FundThesis[]> {
    return Array.from(this.theses.values())
      .filter((t) => t.ownerId === ownerId)
      .map((t) => FundThesis.fromPersistence(t.toJSON()));
  }

  // ── test helpers ──
  count(): number {
    return this.theses.size;
  }
  clear(): void {
    this.theses.clear();
    this.saveCalls.length = 0;
  }
  seed(thesisOrTheses: FundThesis | FundThesis[]): void {
    const arr = Array.isArray(thesisOrTheses) ? thesisOrTheses : [thesisOrTheses];
    for (const t of arr) {
      this.theses.set(t.id, FundThesis.fromPersistence(t.toJSON()));
    }
  }
}
