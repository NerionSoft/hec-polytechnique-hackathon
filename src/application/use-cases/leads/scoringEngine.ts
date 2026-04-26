// Deterministic PE-thesis scoring engine.
// Pure function: no I/O, no Date.now(), no randomness.

import type { ScoreDecision } from "../../domain/lead/enums";

export interface ScoreLeadInput {
  lead: {
    companyName: string;
    country: string;
    sector: string | null;
    estimatedRevenueEur: number | null;
    employeeCount: number | null;
    founderName: string | null;
  };
  enrichment: {
    businessSummary: string;
    investmentRationale: string[];
    concerns: string[];
  };
  thesis: {
    sectors: string[];
    countries: string[];
    minRevenueEur: number | null;
    maxRevenueEur: number | null;
    preferences: {
      founderOwned?: boolean;
      recurringRevenue?: boolean;
      profitable?: boolean;
      fragmentedMarket?: boolean;
      successionRisk?: boolean;
      lowCompetition?: boolean;
    };
  };
}

export interface LeadScoreResult {
  score: number;
  decision: ScoreDecision;
  reasons: string[];
  missingInfo: string[];
}

const SME_EMPLOYEE_MIN = 10;
const SME_EMPLOYEE_MAX = 250;

const RX_RECURRING =
  /\b(saas|abonnement|subscription|mrr|arr|recurring|récurrent|recurrent|renouvellement|multi[- ]year contract|contrat pluriannuel)\b/i;
const RX_PROFITABLE =
  /\b(profitable|rentable|ebitda[- ]positive|ebitda positif|cash[- ]flow positive|bénéficiaire|beneficiaire|positive margins|marges positives|mature)\b/i;
const RX_FRAGMENTED =
  /\b(fragmented|fragmenté|fragmente|buy[- ]and[- ]build|build[- ]up|consolidation|roll[- ]up|marché fragmenté|consolidation play)\b/i;
const RX_SUCCESSION =
  /\b(succession|fondateur[- ]dépendant|founder dependency|founder[- ]dependent|key[- ]person risk|risque homme[- ]clé|retirement|départ à la retraite|transmission|cédant|owner exit)\b/i;
const RX_LOW_COMPETITION =
  /\b(low competition|peu de concurrence|faible concurrence|niche|niche market|marché de niche|defensible moat|barriers to entry|barrières à l'entrée|limited competitors|peu de concurrents)\b/i;

export function scoreLead(input: ScoreLeadInput): LeadScoreResult {
  const { lead, enrichment, thesis } = input;
  const reasons: string[] = [];
  const missingInfo: string[] = [];
  let score = 0;

  const haystack = [
    enrichment.businessSummary ?? "",
    ...(enrichment.investmentRationale ?? []),
    ...(enrichment.concerns ?? []),
  ]
    .join(" ")
    .toLowerCase();

  // Rule 1 — Sector match (+20)
  // Match is a prefix check: a thesis sector code like "62" (NAF division) matches
  // a lead.sector of "6201Z" (full NAF rev2 class). Plain-string equality remains.
  if (thesis.sectors.length === 0) {
    /* permissive thesis, skip */
  } else if (!lead.sector) {
    missingInfo.push("lead.sector unknown — cannot evaluate sector fit");
  } else {
    const leadSector = lead.sector.toLowerCase().trim();
    const matched = thesis.sectors.some((s) => {
      const t = s.toLowerCase().trim();
      return t.length > 0 && (leadSector === t || leadSector.startsWith(t));
    });
    if (matched) {
      score += 20;
      reasons.push(`Sector "${lead.sector}" matches thesis (+20)`);
    } else {
      reasons.push(`Sector "${lead.sector}" outside thesis [${thesis.sectors.join(", ")}] (+0)`);
    }
  }

  // Country eligibility (advisory only, no points)
  if (thesis.countries.length > 0) {
    const inCountry = thesis.countries
      .map((c) => c.toLowerCase().trim())
      .includes(lead.country.toLowerCase().trim());
    if (!inCountry) {
      reasons.push(
        `Country "${lead.country}" outside thesis geography — cross-border review needed`,
      );
      missingInfo.push("countryOutsideThesis: confirm fund mandate permits");
    }
  }

  // Rule 2 — SME size (+15)
  const hasRevenue = typeof lead.estimatedRevenueEur === "number";
  const hasEmployees = typeof lead.employeeCount === "number";
  if (hasRevenue) {
    const rev = lead.estimatedRevenueEur as number;
    const min = thesis.minRevenueEur ?? 0;
    const max = thesis.maxRevenueEur ?? Number.POSITIVE_INFINITY;
    if (rev >= min && rev <= max) {
      score += 15;
      reasons.push(`Revenue €${rev.toLocaleString("en-US")} fits thesis band (+15)`);
    } else {
      reasons.push(
        `Revenue €${rev.toLocaleString("en-US")} outside band [${min}, ${max === Number.POSITIVE_INFINITY ? "∞" : max}] (+0)`,
      );
    }
  } else if (hasEmployees) {
    const emp = lead.employeeCount as number;
    if (emp >= SME_EMPLOYEE_MIN && emp <= SME_EMPLOYEE_MAX) {
      score += 15;
      reasons.push(
        `Employee count ${emp} within SME proxy band [${SME_EMPLOYEE_MIN}, ${SME_EMPLOYEE_MAX}] (+15)`,
      );
    } else {
      reasons.push(
        `Employee count ${emp} outside SME proxy band [${SME_EMPLOYEE_MIN}, ${SME_EMPLOYEE_MAX}] (+0)`,
      );
    }
    missingInfo.push("lead.estimatedRevenueEur unknown — size scored via employee proxy");
  } else {
    missingInfo.push("lead.estimatedRevenueEur AND lead.employeeCount unknown — size rule skipped");
  }

  // Rule 3 — Founder-owned (+15)
  if (thesis.preferences.founderOwned === true) {
    if (lead.founderName && lead.founderName.trim().length > 0) {
      score += 15;
      reasons.push(`Founder-owned signal: founder "${lead.founderName}" identified (+15)`);
    } else {
      missingInfo.push("lead.founderName unknown — founder-owned preference cannot be confirmed");
    }
  }

  // Rules 4-8 — keyword-based bonuses (+10 each)
  const keywordRule = (label: string, pref: boolean | undefined, rx: RegExp): void => {
    if (rx.test(haystack)) {
      score += 10;
      reasons.push(`${label} detected in enrichment narrative (+10)`);
    } else if (pref === true) {
      missingInfo.push(`${label}: thesis prefers it but no keyword evidence`);
    }
  };

  keywordRule("Recurring revenue signal", thesis.preferences.recurringRevenue, RX_RECURRING);
  keywordRule("Profitable / mature signal", thesis.preferences.profitable, RX_PROFITABLE);
  keywordRule(
    "Fragmented market / buy-and-build signal",
    thesis.preferences.fragmentedMarket,
    RX_FRAGMENTED,
  );
  keywordRule(
    "Succession risk / founder-dependency signal",
    thesis.preferences.successionRisk,
    RX_SUCCESSION,
  );
  keywordRule(
    "Low-competition / niche signal",
    thesis.preferences.lowCompetition,
    RX_LOW_COMPETITION,
  );

  score = Math.min(100, Math.max(0, score));

  let decision: ScoreDecision;
  if (score < 40) decision = "REJECT";
  else if (score < 70) decision = "WATCHLIST";
  else decision = "OUTREACH";

  return { score, decision, reasons, missingInfo };
}
