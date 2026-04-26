import { describe, expect, it } from "vitest";
import type { RawCompanyRecord } from "../../ports/types";
import { FundThesisBuilder } from "../../test-support/builders";
import {
  FakeClock,
  FakeCompanyDataSource,
  FakeIdGenerator,
  InMemoryFundThesisRepository,
  InMemoryLeadRepository,
} from "../../test-support/fakes";
import { makeFetchLeadsFromSirene } from "./FetchLeadsFromSirene";

const NOW = new Date("2026-03-10T00:00:00.000Z");

function rec(name: string): RawCompanyRecord {
  return { source: "SIRENE", sourceRef: name, companyName: name };
}

function buildDeps() {
  const sirene = new FakeCompanyDataSource([rec("A"), rec("B")]);
  return {
    leadRepo: new InMemoryLeadRepository(),
    thesisRepo: new InMemoryFundThesisRepository(),
    sirene,
    clock: new FakeClock(NOW),
    idGen: new FakeIdGenerator("lead"),
  };
}

describe("FetchLeadsFromSirene", () => {
  it("happy path with thesisId: persists leads with thesisId", async () => {
    const deps = buildDeps();
    deps.thesisRepo.seed(
      FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build(),
    );

    const result = await makeFetchLeadsFromSirene(deps)({
      ownerId: "owner-1",
      thesisId: "thesis-1",
      query: {},
    });

    expect(result).toEqual({ fetched: 2, imported: 2 });
    const saved = deps.leadRepo.saveManyCalls[0];
    expect(saved).toHaveLength(2);
    expect(saved.every((l) => l.thesisId === "thesis-1")).toBe(true);
    expect(deps.sirene.searchCalls).toHaveLength(1);
  });

  it("throws when thesisId given but owner mismatches; sirene NOT called", async () => {
    const deps = buildDeps();
    deps.thesisRepo.seed(
      FundThesisBuilder.demo().withId("thesis-1").withOwnerId("someone-else").build(),
    );
    await expect(
      makeFetchLeadsFromSirene(deps)({
        ownerId: "owner-1",
        thesisId: "thesis-1",
        query: {},
      }),
    ).rejects.toThrow(/not found for owner/);
    expect(deps.sirene.searchCalls).toEqual([]);
  });

  it("no thesisId: persists leads with null thesisId, query forwarded", async () => {
    const deps = buildDeps();
    const result = await makeFetchLeadsFromSirene(deps)({
      ownerId: "owner-1",
      query: { sectors: ["6201Z"], perPage: 25 },
    });

    expect(result.imported).toBe(2);
    const saved = deps.leadRepo.saveManyCalls[0];
    expect(saved.every((l) => l.thesisId === null)).toBe(true);
    expect(deps.sirene.searchCalls[0]).toEqual({ sectors: ["6201Z"], perPage: 25 });
  });
});
