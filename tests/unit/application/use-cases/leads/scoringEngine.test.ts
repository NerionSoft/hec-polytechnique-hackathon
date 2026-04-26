import { describe, expect, it } from "vitest";
import { scoreLead, type ScoreLeadInput } from "@/src/application/use-cases/leads/scoringEngine";

const baseLead: ScoreLeadInput["lead"] = {
  companyName: "Acme Software SAS",
  country: "France",
  sector: "Software",
  estimatedRevenueEur: 12_000_000,
  employeeCount: 80,
  founderName: "Jean Dupont",
};

const baseEnrichment: ScoreLeadInput["enrichment"] = {
  businessSummary:
    "Acme Software is a profitable SaaS provider with strong recurring revenue (ARR €8M).",
  investmentRationale: [
    "Fragmented market with consolidation opportunity",
    "Founder approaching retirement — succession risk",
    "Niche vertical with low competition and defensible moat",
  ],
  concerns: ["Founder dependency on Jean Dupont"],
};

const baseThesis: ScoreLeadInput["thesis"] = {
  sectors: ["Software", "Healthcare"],
  countries: ["France", "Germany"],
  minRevenueEur: 5_000_000,
  maxRevenueEur: 50_000_000,
  preferences: {
    founderOwned: true,
    recurringRevenue: true,
    profitable: true,
    fragmentedMarket: true,
    successionRisk: true,
    lowCompetition: true,
  },
};

describe("scoreLead — perfect match", () => {
  it("scores 100 and decides OUTREACH when every rule fires", () => {
    const result = scoreLead({ lead: baseLead, enrichment: baseEnrichment, thesis: baseThesis });
    expect(result.score).toBe(100);
    expect(result.decision).toBe("OUTREACH");
    expect(result.missingInfo).toEqual([]);
  });
});

describe("scoreLead — sector mismatch", () => {
  it("loses 20 points and logs a reason", () => {
    const result = scoreLead({
      lead: { ...baseLead, sector: "Defense" },
      enrichment: baseEnrichment,
      thesis: baseThesis,
    });
    expect(result.score).toBe(80);
    expect(result.decision).toBe("OUTREACH");
    expect(result.reasons.some((r) => r.includes("Defense") && r.includes("outside thesis"))).toBe(
      true,
    );
  });
});

describe("scoreLead — country mismatch", () => {
  it("does not penalize but flags missingInfo for cross-border review", () => {
    const result = scoreLead({
      lead: { ...baseLead, country: "Brazil" },
      enrichment: baseEnrichment,
      thesis: baseThesis,
    });
    expect(result.score).toBe(100);
    expect(result.missingInfo.some((m) => m.startsWith("countryOutsideThesis"))).toBe(true);
  });
});

describe("scoreLead — size data", () => {
  it("skips size rule and populates missingInfo when both revenue and employees are absent", () => {
    const result = scoreLead({
      lead: { ...baseLead, estimatedRevenueEur: null, employeeCount: null },
      enrichment: baseEnrichment,
      thesis: baseThesis,
    });
    expect(result.score).toBe(85);
    expect(result.missingInfo.some((m) => m.includes("size rule skipped"))).toBe(true);
  });

  it("falls back to employee proxy when only revenue is missing", () => {
    const result = scoreLead({
      lead: { ...baseLead, estimatedRevenueEur: null, employeeCount: 80 },
      enrichment: baseEnrichment,
      thesis: baseThesis,
    });
    expect(result.score).toBe(100);
    expect(result.missingInfo.some((m) => m.includes("estimatedRevenueEur unknown"))).toBe(true);
  });
});

describe("scoreLead — WATCHLIST/OUTREACH boundary", () => {
  const minimalThesis: ScoreLeadInput["thesis"] = {
    sectors: ["Software"],
    countries: ["France"],
    minRevenueEur: 5_000_000,
    maxRevenueEur: 50_000_000,
    preferences: {
      founderOwned: true,
      recurringRevenue: true,
      profitable: true,
      fragmentedMarket: false,
      successionRisk: false,
      lowCompetition: false,
    },
  };

  it("scores 60 → WATCHLIST when only recurring keyword fires", () => {
    const sparse: ScoreLeadInput["enrichment"] = {
      businessSummary: "Standard SaaS company.",
      investmentRationale: [],
      concerns: [],
    };
    const r = scoreLead({ lead: baseLead, enrichment: sparse, thesis: minimalThesis });
    // 20 sector + 15 size + 15 founder + 10 recurring = 60
    expect(r.score).toBe(60);
    expect(r.decision).toBe("WATCHLIST");
  });

  it("scores 70 → OUTREACH when profitable keyword also fires", () => {
    const richer: ScoreLeadInput["enrichment"] = {
      businessSummary: "Profitable SaaS company with strong margins.",
      investmentRationale: [],
      concerns: [],
    };
    const r = scoreLead({ lead: baseLead, enrichment: richer, thesis: minimalThesis });
    expect(r.score).toBe(70);
    expect(r.decision).toBe("OUTREACH");
  });
});

describe("scoreLead — founder-owned semantics", () => {
  it("awards +15 when founder + preference present", () => {
    const r = scoreLead({ lead: baseLead, enrichment: baseEnrichment, thesis: baseThesis });
    expect(r.reasons.some((x) => x.includes("Founder-owned signal"))).toBe(true);
  });

  it("skips rule when preference undefined", () => {
    const thesis: ScoreLeadInput["thesis"] = {
      ...baseThesis,
      preferences: { ...baseThesis.preferences, founderOwned: undefined },
    };
    const r = scoreLead({
      lead: { ...baseLead, founderName: null },
      enrichment: baseEnrichment,
      thesis,
    });
    expect(r.missingInfo.some((m) => m.includes("founderName"))).toBe(false);
    expect(r.reasons.some((x) => x.includes("Founder-owned signal"))).toBe(false);
  });

  it("flags missingInfo when preference=true but founderName absent", () => {
    const r = scoreLead({
      lead: { ...baseLead, founderName: null },
      enrichment: baseEnrichment,
      thesis: baseThesis,
    });
    expect(r.missingInfo.some((m) => m.includes("lead.founderName unknown"))).toBe(true);
  });
});

describe("scoreLead — keyword detection (FR + EN)", () => {
  it("detects English subscription keyword", () => {
    const e: ScoreLeadInput["enrichment"] = {
      businessSummary: "Vertical software sold on a subscription basis.",
      investmentRationale: [],
      concerns: [],
    };
    const r = scoreLead({
      lead: baseLead,
      enrichment: e,
      thesis: { ...baseThesis, preferences: { recurringRevenue: true } },
    });
    expect(r.reasons.some((x) => x.includes("Recurring revenue signal"))).toBe(true);
  });

  it("detects French abonnement keyword", () => {
    const e: ScoreLeadInput["enrichment"] = {
      businessSummary: "Solution logicielle vendue par abonnement annuel.",
      investmentRationale: [],
      concerns: [],
    };
    const r = scoreLead({
      lead: baseLead,
      enrichment: e,
      thesis: { ...baseThesis, preferences: { recurringRevenue: true } },
    });
    expect(r.reasons.some((x) => x.includes("Recurring revenue signal"))).toBe(true);
  });
});

describe("scoreLead — empty inputs", () => {
  it("scores 0 → REJECT when nothing can fire", () => {
    const r = scoreLead({
      lead: {
        companyName: "Unknown Co",
        country: "France",
        sector: null,
        estimatedRevenueEur: null,
        employeeCount: null,
        founderName: null,
      },
      enrichment: { businessSummary: "", investmentRationale: [], concerns: [] },
      thesis: {
        sectors: [],
        countries: [],
        minRevenueEur: null,
        maxRevenueEur: null,
        preferences: {},
      },
    });
    expect(r.score).toBe(0);
    expect(r.decision).toBe("REJECT");
    expect(r.reasons).toEqual([]);
  });
});

describe("scoreLead — defensive cap", () => {
  it("never exceeds 100", () => {
    const r = scoreLead({ lead: baseLead, enrichment: baseEnrichment, thesis: baseThesis });
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
