import { describe, expect, it } from "vitest";
import { Lead, type LeadId } from "@/src/application/domain/lead/Lead";
import { LEAD_SOURCE, LEAD_STATUS, SCORE_DECISION } from "@/src/application/domain/lead/enums";
import type { EnrichmentResult, WebsiteSnapshot } from "@/src/application/ports/types";
import type { WebsiteScraper } from "@/src/application/ports/WebsiteScraper";
import {
  FakeClock,
  FakeLeadEnricher,
  FakeWebsiteScraper,
  InMemoryEnrichmentCache,
  InMemoryLeadEnrichmentRepository,
  InMemoryLeadRepository,
  InMemoryWebsiteSnapshotCache,
} from "@/tests/shared/test-support/fakes";
import { makeEnrichLead, type EnrichLeadDeps } from "@/src/application/use-cases/leads/EnrichLead";

const NOW = new Date("2026-01-15T12:00:00.000Z");
const ACME_URL = "https://acme.test";

function buildLead(overrides: Partial<{ id: string; website: string | null }> = {}): Lead {
  return Lead.create({
    id: (overrides.id ?? "lead-1") as LeadId,
    source: LEAD_SOURCE.MANUAL,
    companyName: "Acme SAS",
    website: overrides.website === undefined ? ACME_URL : overrides.website,
    country: "FR",
    now: NOW,
  });
}

function buildSnapshot(url = ACME_URL): WebsiteSnapshot {
  return {
    url,
    title: "Acme",
    description: "Industrial SaaS",
    h1s: ["Acme"],
    h2s: [],
    emails: [],
    socialLinks: [],
    fetchedAt: NOW,
  };
}

function buildEnrichment(promptHash = ""): EnrichmentResult {
  return {
    businessSummary: "Profitable SaaS",
    investmentRationale: ["Recurring revenue"],
    concerns: [],
    suggestedOutreachAngle: "Discuss roll-up",
    peFitScore: 80,
    peFitDecision: SCORE_DECISION.OUTREACH,
    reasons: ["Sector match"],
    missingInfo: [],
    model: "fake-model",
    promptHash,
    promptTokens: 100,
    completionTokens: 50,
  };
}

function buildDeps(): EnrichLeadDeps & {
  leadRepo: InMemoryLeadRepository;
  enricher: FakeLeadEnricher;
  enrichmentCache: InMemoryEnrichmentCache;
  enrichmentRepo: InMemoryLeadEnrichmentRepository;
  scraper: FakeWebsiteScraper;
  snapshotCache: InMemoryWebsiteSnapshotCache;
  clock: FakeClock;
} {
  const enricher = new FakeLeadEnricher(buildEnrichment());
  const scraper = new FakeWebsiteScraper();
  scraper.setSnapshot(buildSnapshot());
  return {
    leadRepo: new InMemoryLeadRepository(),
    enricher,
    enrichmentCache: new InMemoryEnrichmentCache(),
    enrichmentRepo: new InMemoryLeadEnrichmentRepository(),
    scraper,
    snapshotCache: new InMemoryWebsiteSnapshotCache(),
    clock: new FakeClock(NOW),
  };
}

describe("EnrichLead", () => {
  it("happy path: scrapes, calls LLM, populates both caches and marks ENRICHED", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);

    const result = await makeEnrichLead(deps)({ ownerId: "owner-1", leadId: lead.id });

    expect(deps.scraper.scrapeCalls).toEqual([ACME_URL]);
    expect(deps.enricher.enrichCalls).toHaveLength(1);
    expect(await deps.snapshotCache.get(ACME_URL)).not.toBeNull();
    expect(deps.enrichmentCache.has(result.enrichment.promptHash)).toBe(true);
    expect(await deps.enrichmentRepo.findByLeadId(lead.id)).not.toBeNull();
    const persisted = await deps.leadRepo.findById(lead.id);
    expect(persisted?.status).toBe(LEAD_STATUS.ENRICHED);
    expect(result.scrapeFromCache).toBe(false);
    expect(result.enrichmentFromCache).toBe(false);
  });

  it("snapshot cache hit: scraper not called", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    await deps.snapshotCache.set(buildSnapshot());

    const result = await makeEnrichLead(deps)({ ownerId: "owner-1", leadId: lead.id });

    expect(deps.scraper.scrapeCalls).toEqual([]);
    expect(result.scrapeFromCache).toBe(true);
    expect(deps.enricher.enrichCalls).toHaveLength(1);
  });

  it("enrichment cache hit: LLM not called", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    const snapshot = buildSnapshot();
    await deps.snapshotCache.set(snapshot);

    // Pre-compute the hash that the enricher will produce for this exact input.
    const cachedHash = deps.enricher.computePromptHash({
      lead: {
        companyName: lead.companyName,
        website: lead.website,
        country: lead.country,
        sector: lead.sector,
        employeeCount: lead.employeeCount,
        estimatedRevenueEur: lead.estimatedRevenueEur,
        founderName: lead.founderName,
      },
      website: snapshot,
    });
    await deps.enrichmentCache.set(buildEnrichment(cachedHash));

    const result = await makeEnrichLead(deps)({ ownerId: "owner-1", leadId: lead.id });

    expect(deps.enricher.enrichCalls).toEqual([]);
    expect(result.enrichmentFromCache).toBe(true);
    expect(deps.scraper.scrapeCalls).toEqual([]); // came from snapshot cache
  });

  it("lead has no website: scraper not called, snapshot null in EnrichInput", async () => {
    const deps = buildDeps();
    const lead = buildLead({ website: null });
    deps.leadRepo.seed(lead);

    const result = await makeEnrichLead(deps)({ ownerId: "owner-1", leadId: lead.id });

    expect(deps.scraper.scrapeCalls).toEqual([]);
    expect(result.websiteSnapshot).toBeNull();
    expect(deps.enricher.enrichCalls[0]?.website).toBeNull();
  });

  it("scraper throws: snapshot stays null but enrichment still happens", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    const failingScraper: WebsiteScraper = {
      scrape: async () => {
        throw new Error("boom");
      },
    };

    const result = await makeEnrichLead({ ...deps, scraper: failingScraper })({
      ownerId: "owner-1",
      leadId: lead.id,
    });

    expect(result.websiteSnapshot).toBeNull();
    expect(deps.enricher.enrichCalls).toHaveLength(1);
    expect((await deps.leadRepo.findById(lead.id))?.status).toBe(LEAD_STATUS.ENRICHED);
  });

  it("forceRescrape: bypasses snapshot cache", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    await deps.snapshotCache.set(buildSnapshot());

    const result = await makeEnrichLead(deps)({
      ownerId: "owner-1",
      leadId: lead.id,
      forceRescrape: true,
    });

    expect(deps.scraper.scrapeCalls).toEqual([ACME_URL]);
    expect(result.scrapeFromCache).toBe(false);
  });

  it("forceReenrich: bypasses enrichment cache", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    await deps.enrichmentCache.set(buildEnrichment("any-hash"));

    const result = await makeEnrichLead(deps)({
      ownerId: "owner-1",
      leadId: lead.id,
      forceReenrich: true,
    });

    expect(deps.enricher.enrichCalls).toHaveLength(1);
    expect(result.enrichmentFromCache).toBe(false);
  });

  it("throws when lead not found", async () => {
    const deps = buildDeps();
    await expect(
      makeEnrichLead(deps)({ ownerId: "owner-1", leadId: "missing" as LeadId }),
    ).rejects.toThrow(/not found/);
  });
});
