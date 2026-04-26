import type { LeadRepository } from "../../ports/LeadRepository";
import type { Clock } from "../../ports/Clock";
import type { IdGenerator } from "../../ports/IdGenerator";
import type { RawCompanyRecord } from "../../ports/types";
import { persistRawRecords } from "./PersistRawRecords";

export interface ImportLeadsFromCsvCommand {
  ownerId: string;
  thesisId?: string;
  importBatchId: string;
  records: RawCompanyRecord[];
}

export interface ImportLeadsFromCsvResult {
  imported: number;
}

export interface ImportLeadsFromCsvDeps {
  leadRepo: LeadRepository;
  clock: Clock;
  idGen: IdGenerator;
}

export function makeImportLeadsFromCsv(deps: ImportLeadsFromCsvDeps) {
  const persist = persistRawRecords(deps);
  return async (cmd: ImportLeadsFromCsvCommand): Promise<ImportLeadsFromCsvResult> => {
    const { leads } = await persist(cmd.records, {
      thesisId: cmd.thesisId ?? null,
      importBatchId: cmd.importBatchId,
    });
    return { imported: leads.length };
  };
}
