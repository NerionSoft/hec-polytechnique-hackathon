export interface OutreachDrafterInput {
  lead: {
    companyName: string;
    country: string;
    sector: string | null;
    website: string | null;
    founderName: string | null;
  };
  thesis: {
    name: string;
    sectors: string[];
    countries: string[];
    minRevenueEur: number | null;
    maxRevenueEur: number | null;
  };
  enrichment: {
    businessSummary: string;
    investmentRationale: string[];
    suggestedOutreachAngle: string;
  };
  fund: {
    senderName: string | null;
    fundName: string | null;
  };
}

export interface OutreachDrafterOutput {
  subject: string;
  body: string;
  model: string;
  promptHash: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

export interface OutreachDrafter {
  draft(input: OutreachDrafterInput): Promise<OutreachDrafterOutput>;
}
