import type { CompanyDataSource } from "../../ports/CompanyDataSource";
import type { FundThesisRepository } from "../../ports/FundThesisRepository";
import type { SireneSearchQuery } from "../../ports/types";
import { persistRawRecords, type PersistRawRecordsDeps } from "./PersistRawRecords";

export interface FetchLeadsFromSireneCommand {
  ownerId: string;
  thesisId?: string;
  query: SireneSearchQuery;
  // Number of consecutive Sirene pages to fetch (each page is capped at 25 by the API).
  // Defaults to 1; max enforced upstream in the route schema.
  pages?: number;
}

export interface FetchLeadsFromSireneResult {
  fetched: number;
  imported: number;
}

export interface FetchLeadsFromSireneDeps extends PersistRawRecordsDeps {
  sirene: CompanyDataSource;
  thesisRepo: FundThesisRepository;
}

export function makeFetchLeadsFromSirene(deps: FetchLeadsFromSireneDeps) {
  const persist = persistRawRecords(deps);
  return async (cmd: FetchLeadsFromSireneCommand): Promise<FetchLeadsFromSireneResult> => {
    if (cmd.thesisId) {
      const thesis = await deps.thesisRepo.findById(cmd.thesisId);
      if (!thesis || thesis.ownerId !== cmd.ownerId) {
        throw new Error(`Thesis ${cmd.thesisId} not found for owner ${cmd.ownerId}`);
      }
    }
    const totalPages = Math.max(1, Math.min(cmd.pages ?? 1, 10));
    const startPage = cmd.query.page ?? 1;
    const aggregated: Awaited<ReturnType<typeof deps.sirene.search>> = [];
    for (let p = startPage; p < startPage + totalPages; p += 1) {
      const records = await deps.sirene.search({ ...cmd.query, page: p });
      if (records.length === 0) break;
      aggregated.push(...records);
    }
    const { leads } = await persist(aggregated, {
      thesisId: cmd.thesisId ?? null,
      importBatchId: null,
    });
    return { fetched: aggregated.length, imported: leads.length };
  };
}
