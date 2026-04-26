import { describe, expect, it } from "vitest";
import type { RawCompanyRecord } from "@/src/application/ports/types";
import {
  FakeClock,
  FakeIdGenerator,
  InMemoryLeadRepository,
} from "@/tests/shared/test-support/fakes";
import { makeImportLeadsFromCsv } from "@/src/application/use-cases/leads/ImportLeadsFromCsv";

const NOW = new Date("2026-03-01T00:00:00.000Z");

function rec(name: string): RawCompanyRecord {
  return { source: "CSV_IMPORT", sourceRef: name, companyName: name };
}

describe("ImportLeadsFromCsv", () => {
  it("imports N records and stamps importBatchId on every lead", async () => {
    const leadRepo = new InMemoryLeadRepository();
    const importer = makeImportLeadsFromCsv({
      leadRepo,
      clock: new FakeClock(NOW),
      idGen: new FakeIdGenerator("lead"),
    });

    const result = await importer({
      ownerId: "owner-1",
      importBatchId: "batch-42",
      records: [rec("A"), rec("B"), rec("C")],
    });

    expect(result.imported).toBe(3);
    expect(leadRepo.saveManyCalls).toHaveLength(1);
    const saved = leadRepo.saveManyCalls[0];
    expect(saved).toHaveLength(3);
    expect(saved.every((l) => l.toJSON().importBatchId === "batch-42")).toBe(true);
  });

  it("empty records → 0 imported, repo still receives an empty saveMany call", async () => {
    const leadRepo = new InMemoryLeadRepository();
    const importer = makeImportLeadsFromCsv({
      leadRepo,
      clock: new FakeClock(NOW),
      idGen: new FakeIdGenerator("lead"),
    });

    const result = await importer({
      ownerId: "owner-1",
      importBatchId: "batch-empty",
      records: [],
    });

    expect(result.imported).toBe(0);
    expect(leadRepo.count()).toBe(0);
  });

  it("propagates thesisId when given", async () => {
    const leadRepo = new InMemoryLeadRepository();
    const importer = makeImportLeadsFromCsv({
      leadRepo,
      clock: new FakeClock(NOW),
      idGen: new FakeIdGenerator("lead"),
    });

    await importer({
      ownerId: "owner-1",
      thesisId: "thesis-7",
      importBatchId: "batch-1",
      records: [rec("X")],
    });

    expect(leadRepo.saveManyCalls[0][0].thesisId).toBe("thesis-7");
  });
});
