import { Lead, type LeadId } from "../../domain/lead/Lead";
import type { LeadRepository } from "../../ports/LeadRepository";
import type { Clock } from "../../ports/Clock";
import type { IdGenerator } from "../../ports/IdGenerator";
import type { RawCompanyRecord } from "../../ports/types";

export interface PersistOptions {
  thesisId: string | null;
  importBatchId: string | null;
}

export interface PersistRawRecordsDeps {
  leadRepo: LeadRepository;
  clock: Clock;
  idGen: IdGenerator;
}

export function persistRawRecords(deps: PersistRawRecordsDeps) {
  return async (
    records: RawCompanyRecord[],
    options: PersistOptions,
  ): Promise<{ leads: Lead[] }> => {
    const now = deps.clock.now();
    const leads = records.map((rec) =>
      Lead.create({
        id: deps.idGen.newId() as LeadId,
        source: rec.source,
        sourceRef: rec.sourceRef,
        importBatchId: options.importBatchId,
        companyName: rec.companyName,
        legalName: rec.legalName ?? null,
        website: rec.website ?? null,
        country: rec.country ?? "FR",
        sector: rec.sector ?? null,
        napCode: rec.napCode ?? null,
        employeeCount: rec.employeeCount ?? null,
        estimatedRevenueEur: rec.estimatedRevenueEur ?? null,
        founderName: rec.founderName ?? null,
        thesisId: options.thesisId,
        now,
      }),
    );
    await deps.leadRepo.saveMany(leads);
    return { leads };
  };
}
