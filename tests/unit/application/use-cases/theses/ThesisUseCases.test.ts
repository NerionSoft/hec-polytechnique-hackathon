import { describe, expect, it } from "vitest";
import { FundThesisBuilder } from "@/src/application/test-support/builders/index";
import {
  FakeClock,
  FakeIdGenerator,
  InMemoryFundThesisRepository,
} from "@/tests/shared/test-support/fakes";
import {
  makeCreateThesis,
  makeDeleteThesis,
  makeGetThesisById,
  makeListTheses,
  makeUpdateThesis,
} from "@/src/application/use-cases/theses/ThesisUseCases";

const NOW = new Date("2026-04-01T00:00:00.000Z");
const LATER = new Date("2026-04-02T00:00:00.000Z");

describe("CreateThesis", () => {
  it("creates with defaults using idGen + clock", async () => {
    const repo = new InMemoryFundThesisRepository();
    const create = makeCreateThesis({
      thesisRepo: repo,
      idGen: new FakeIdGenerator("thesis"),
      clock: new FakeClock(NOW),
    });

    const t = await create({ ownerId: "owner-1", name: "Solo" });

    expect(t.id).toBe("thesis-0");
    expect(t.sectors).toEqual([]);
    expect(t.countries).toEqual([]);
    expect(t.toJSON().createdAt).toEqual(NOW);
    expect(await repo.findById("thesis-0")).not.toBeNull();
  });
});

describe("ListTheses", () => {
  it("returns only theses owned by the requested user", async () => {
    const repo = new InMemoryFundThesisRepository();
    repo.seed(FundThesisBuilder.demo().withId("a").withOwnerId("owner-1").build());
    repo.seed(FundThesisBuilder.demo().withId("b").withOwnerId("owner-2").build());

    const out = await makeListTheses({ thesisRepo: repo })("owner-1");

    expect(out.map((t) => t.id)).toEqual(["a"]);
  });
});

describe("GetThesisById", () => {
  it("returns null on owner mismatch, the thesis on match", async () => {
    const repo = new InMemoryFundThesisRepository();
    repo.seed(FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build());

    const get = makeGetThesisById({ thesisRepo: repo });
    expect(await get({ ownerId: "owner-2", id: "thesis-1" })).toBeNull();
    expect(await get({ ownerId: "owner-1", id: "thesis-1" })).not.toBeNull();
  });
});

describe("UpdateThesis", () => {
  it("throws on owner mismatch", async () => {
    const repo = new InMemoryFundThesisRepository();
    repo.seed(FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build());
    const update = makeUpdateThesis({ thesisRepo: repo, clock: new FakeClock(LATER) });

    await expect(
      update({ ownerId: "intruder", id: "thesis-1", patch: { name: "Hijack" } }),
    ).rejects.toThrow(/not found for owner/);
  });

  it("partial patch only updates provided fields, preserves the rest, refreshes updatedAt", async () => {
    const repo = new InMemoryFundThesisRepository();
    const original = FundThesisBuilder.demo()
      .withId("thesis-1")
      .withOwnerId("owner-1")
      .withSectors(["Software"])
      .withCountries(["FR"])
      .withRevenueRange(1_000_000, 20_000_000)
      .withPreferences({ founderOwned: true })
      .build();
    repo.seed(original);
    const update = makeUpdateThesis({ thesisRepo: repo, clock: new FakeClock(LATER) });

    const updated = await update({
      ownerId: "owner-1",
      id: "thesis-1",
      patch: { name: "  Renamed  ", maxRevenueEur: 99_000_000 },
    });

    expect(updated.name).toBe("Renamed");
    expect(updated.maxRevenueEur).toBe(99_000_000);
    expect(updated.sectors).toEqual(original.sectors);
    expect(updated.countries).toEqual(original.countries);
    expect(updated.minRevenueEur).toBe(original.minRevenueEur);
    expect(updated.preferences).toEqual(original.preferences);
    expect(updated.toJSON().updatedAt).toEqual(LATER);
  });
});

describe("DeleteThesis", () => {
  it("soft-deletes by setting active=false", async () => {
    const repo = new InMemoryFundThesisRepository();
    repo.seed(FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build());
    const del = makeDeleteThesis({ thesisRepo: repo });

    await del({ ownerId: "owner-1", id: "thesis-1" });

    const after = await repo.findById("thesis-1");
    expect(after?.active).toBe(false);
  });

  it("throws on owner mismatch", async () => {
    const repo = new InMemoryFundThesisRepository();
    repo.seed(FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build());
    const del = makeDeleteThesis({ thesisRepo: repo });
    await expect(del({ ownerId: "outsider", id: "thesis-1" })).rejects.toThrow(
      /not found for owner/,
    );
  });
});
