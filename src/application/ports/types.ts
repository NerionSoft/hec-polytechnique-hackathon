import type { LeadStatus, ScoreDecision } from "../domain/lead/enums";

export interface RawCompanyRecord {
  source: "SIRENE" | "CSV_IMPORT" | "MANUAL" | "COMPANY_WEBSITE";
  sourceRef: string | null;
  companyName: string;
  legalName?: string | null;
  website?: string | null;
  country?: string;
  sector?: string | null;
  napCode?: string | null;
  employeeCount?: number | null;
  estimatedRevenueEur?: number | null;
  founderName?: string | null;
}

export interface ListLeadsQuery {
  ownerId: string;
  status?: LeadStatus;
  thesisId?: string;
  limit?: number;
  offset?: number;
}

export interface WebsiteSnapshot {
  url: string;
  title: string | null;
  description: string | null;
  h1s: string[];
  h2s: string[];
  emails: string[];
  socialLinks: string[];
  fetchedAt: Date;
}

export interface EnrichInput {
  lead: {
    companyName: string;
    website: string | null;
    country: string;
    sector: string | null;
    employeeCount: number | null;
    estimatedRevenueEur: number | null;
    founderName: string | null;
  };
  website: WebsiteSnapshot | null;
}

export interface EnrichmentResult {
  businessSummary: string;
  investmentRationale: string[];
  concerns: string[];
  suggestedOutreachAngle: string;
  peFitScore: number;
  peFitDecision: ScoreDecision;
  reasons: string[];
  missingInfo: string[];
  model: string;
  promptHash: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

export interface SireneSearchQuery {
  sectors?: string[]; // NAF codes
  postalCodes?: string[];
  employeeBracketCodes?: string[]; // tranche_effectif_salarie
  legalFormCodes?: string[];
  page?: number;
  perPage?: number;
}
