import type { RawCompanyRecord, SireneSearchQuery } from "./types";

export interface CompanyDataSource {
  search(query: SireneSearchQuery): Promise<RawCompanyRecord[]>;
}
