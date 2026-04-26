import type { EnrichInput, EnrichmentResult } from "./types";

export interface LeadEnricher {
  enrich(input: EnrichInput): Promise<EnrichmentResult>;
  computePromptHash(input: EnrichInput): string;
}

export interface EnrichmentCache {
  get(promptHash: string): Promise<EnrichmentResult | null>;
  set(result: EnrichmentResult): Promise<void>;
}
