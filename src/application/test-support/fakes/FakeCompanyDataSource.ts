import type { CompanyDataSource } from "../../ports/CompanyDataSource";
import type { RawCompanyRecord, SireneSearchQuery } from "../../ports/types";

export class FakeCompanyDataSource implements CompanyDataSource {
  private records: RawCompanyRecord[] = [];
  readonly searchCalls: SireneSearchQuery[] = [];

  constructor(records: RawCompanyRecord[] = []) {
    this.records = records;
  }

  async search(query: SireneSearchQuery): Promise<RawCompanyRecord[]> {
    this.searchCalls.push(query);
    return [...this.records];
  }

  // ── test helpers ──
  setResults(records: RawCompanyRecord[]): void {
    this.records = records;
  }
  clear(): void {
    this.records = [];
    this.searchCalls.length = 0;
  }
}
