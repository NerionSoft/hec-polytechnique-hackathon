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
  // Full NAF rev2 codes in API format (e.g. "62.01Z"). Forwarded as `activite_principale`.
  sectors?: string[];
  // NAF section letters A–U. Forwarded as `section_activite_principale` for coarse filtering.
  sections?: string[];
  // Full 5-digit postal codes (e.g. "75001"). Forwarded as `code_postal`.
  postalCodes?: string[];
  // INSEE département codes (e.g. "75", "2A"). Forwarded as `departement`.
  departements?: string[];
  employeeBracketCodes?: string[]; // tranche_effectif_salarie
  legalFormCodes?: string[];
  page?: number;
  perPage?: number;
}
