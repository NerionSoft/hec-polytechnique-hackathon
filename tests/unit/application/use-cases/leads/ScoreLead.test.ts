import { describe, expect, it } from "vitest";
import { Lead, type LeadId } from "@/src/application/domain/lead/Lead";
import { LEAD_SOURCE, LEAD_STATUS, SCORE_DECISION } from "@/src/application/domain/lead/enums";
import type { EnrichmentResult } from "@/src/application/ports/types";
import { FundThesisBuilder } from "@/src/application/test-support/builders/index";
import {
  FakeClock,
  InMemoryFundThesisRepository,
  InMemoryLeadEnrichmentRepository,
  InMemoryLeadRepository,
  InMemoryLeadScoreRepository,
} from "@/tests/shared/test-support/fakes";
import { makeScoreLead } from "@/src/application/use-cases/leads/ScoreLead";

const NOW = new Date("2026-02-01T08:00:00.000Z");

function buildLead(): Lead {
  return Lead.create({
    id: "lead-1" as LeadId,
    source: LEAD_SOURCE.MANUAL,
    companyName: "Acme SAS",
    country: "France",
    sector: "Software",
    estimatedRevenueEur: 12_000_000,
    employeeCount: 80,
    founderName: "Jean Dupont",
    now: NOW,
  });
}

function buildEnrichment(): EnrichmentResult {
  return {
    businessSummary: "Profitable SaaS with recurring revenue",
    investmentRationale: ["Niche market"],
    concerns: [],
    suggestedOutreachAngle: "X",
    peFitScore: 70,
    peFitDecision: SCORE_DECISION.OUTREACH,
    reasons: [],
    missingInfo: [],
    model: "fake",
    promptHash: "h",
    promptTokens: null,
    completionTokens: null,
  };
}

function buildDeps() {
  return {
    leadRepo: new InMemoryLeadRepository(),
    thesisRepo: new InMemoryFundThesisRepository(),
    enrichmentRepo: new InMemoryLeadEnrichmentRepository(),
    scoreRepo: new InMemoryLeadScoreRepository(),
    clock: new FakeClock(NOW),
  };
}

describe("ScoreLead", () => {
  it("happy path: persists score and marks lead SCORED", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    deps.thesisRepo.seed(
      FundThesisBuilder.demo()
        .withId("thesis-1")
        .withOwnerId("owner-1")
        .withSectors(["Software"])
        .withCountries(["France"])
        .withRevenueRange(5_000_000, 50_000_000)
        .withPreferences({ founderOwned: true })
        .build(),
    );
    deps.enrichmentRepo.seed(lead.id, buildEnrichment());

    const result = await makeScoreLead(deps)({
      ownerId: "owner-1",
      leadId: lead.id,
      thesisId: "thesis-1",
    });

    const persisted = await deps.scoreRepo.findByLeadId(lead.id);
    expect(persisted?.score).toBe(result.score);
    expect(persisted?.thesisId).toBe("thesis-1");
    expect(persisted?.decision).toBe(result.decision);
    expect((await deps.leadRepo.findById(lead.id))?.status).toBe(LEAD_STATUS.SCORED);
  });

  it("throws when lead not found", async () => {
    const deps = buildDeps();
    deps.thesisRepo.seed(
      FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build(),
    );
    await expect(
      makeScoreLead(deps)({ ownerId: "owner-1", leadId: "x" as LeadId, thesisId: "thesis-1" }),
    ).rejects.toThrow(/Lead .* not found/);
  });

  it("throws when thesis not found", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    await expect(
      makeScoreLead(deps)({ ownerId: "owner-1", leadId: lead.id, thesisId: "missing" }),
    ).rejects.toThrow(/Thesis .* not found/);
  });

  it("throws on thesis owner mismatch", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    deps.thesisRepo.seed(
      FundThesisBuilder.demo().withId("thesis-1").withOwnerId("someone-else").build(),
    );
    await expect(
      makeScoreLead(deps)({ ownerId: "owner-1", leadId: lead.id, thesisId: "thesis-1" }),
    ).rejects.toThrow(/not found for owner/);
  });

  it("throws with helpful message when enrichment is missing", async () => {
    const deps = buildDeps();
    const lead = buildLead();
    deps.leadRepo.seed(lead);
    deps.thesisRepo.seed(
      FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build(),
    );
    await expect(
      makeScoreLead(deps)({ ownerId: "owner-1", leadId: lead.id, thesisId: "thesis-1" }),
    ).rejects.toThrow(/no enrichment yet/);
  });
});
