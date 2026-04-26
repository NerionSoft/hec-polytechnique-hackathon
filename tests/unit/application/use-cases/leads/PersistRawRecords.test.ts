import { describe, expect, it } from "vitest";
import { LEAD_STATUS } from "@/src/application/domain/lead/enums";
import type { RawCompanyRecord } from "@/src/application/ports/types";
import {
  FakeClock,
  FakeIdGenerator,
  InMemoryLeadRepository,
} from "@/tests/shared/test-support/fakes";
import { persistRawRecords } from "@/src/application/use-cases/leads/PersistRawRecords";

const NOW = new Date("2026-03-15T10:00:00.000Z");

describe("persistRawRecords", () => {
  it("creates Lead instances with status NEW, uses idGen + clock, calls saveMany once", async () => {
    const leadRepo = new InMemoryLeadRepository();
    const idGen = new FakeIdGenerator("lead");
    const clock = new FakeClock(NOW);

    const records: RawCompanyRecord[] = [
      { source: "SIRENE", sourceRef: "1", companyName: "A" },
      { source: "SIRENE", sourceRef: "2", companyName: "B", country: "BE" },
    ];

    const { leads } = await persistRawRecords({ leadRepo, idGen, clock })(records, {
      thesisId: "thesis-7",
      importBatchId: null,
    });

    expect(leads.map((l) => l.id)).toEqual(["lead-0", "lead-1"]);
    expect(leads.every((l) => l.status === LEAD_STATUS.NEW)).toBe(true);
    expect(leads.every((l) => l.toJSON().createdAt.getTime() === NOW.getTime())).toBe(true);
    expect(leads[0].country).toBe("FR"); // default
    expect(leads[1].country).toBe("BE");
    expect(leadRepo.saveManyCalls).toHaveLength(1);
    expect(leadRepo.saveManyCalls[0]).toHaveLength(2);
  });

  it("empty records → empty save", async () => {
    const leadRepo = new InMemoryLeadRepository();
    const { leads } = await persistRawRecords({
      leadRepo,
      idGen: new FakeIdGenerator(),
      clock: new FakeClock(NOW),
    })([], { thesisId: null, importBatchId: null });

    expect(leads).toEqual([]);
    expect(leadRepo.saveManyCalls).toEqual([[]]);
  });
});
