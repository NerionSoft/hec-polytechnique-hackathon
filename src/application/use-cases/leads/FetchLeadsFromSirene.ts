import type { CompanyDataSource } from "../../ports/CompanyDataSource";
import type { FundThesisRepository } from "../../ports/FundThesisRepository";
import type { SireneSearchQuery } from "../../ports/types";
import { persistRawRecords, type PersistRawRecordsDeps } from "./PersistRawRecords";

export interface FetchLeadsFromSireneCommand {
  ownerId: string;
  thesisId?: string;
  query: SireneSearchQuery;
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
    const records = await deps.sirene.search(cmd.query);
    const { leads } = await persist(records, {
      thesisId: cmd.thesisId ?? null,
      importBatchId: null,
    });
    return { fetched: records.length, imported: leads.length };
  };
}
