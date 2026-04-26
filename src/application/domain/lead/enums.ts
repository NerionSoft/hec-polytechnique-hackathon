export const LEAD_SOURCE = {
  MANUAL: "MANUAL",
  CSV_IMPORT: "CSV_IMPORT",
  SIRENE: "SIRENE",
  COMPANY_WEBSITE: "COMPANY_WEBSITE",
} as const;
export type LeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];

export const LEAD_STATUS = {
  NEW: "NEW",
  ENRICHING: "ENRICHING",
  ENRICHED: "ENRICHED",
  SCORED: "SCORED",
  QUALIFIED: "QUALIFIED",
  REJECTED: "REJECTED",
  CONTACTED: "CONTACTED",
  DATA_ROOM_OPENED: "DATA_ROOM_OPENED",
} as const;
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const SCORE_DECISION = {
  REJECT: "REJECT",
  WATCHLIST: "WATCHLIST",
  OUTREACH: "OUTREACH",
} as const;
export type ScoreDecision = (typeof SCORE_DECISION)[keyof typeof SCORE_DECISION];
