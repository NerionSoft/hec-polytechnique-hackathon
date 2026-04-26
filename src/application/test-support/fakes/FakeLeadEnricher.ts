import type { LeadEnricher } from "../../ports/LeadEnricher";
import type { EnrichInput, EnrichmentResult } from "../../ports/types";

type ResultProvider = EnrichmentResult | ((input: EnrichInput) => EnrichmentResult);

export class FakeLeadEnricher implements LeadEnricher {
  private provider: ResultProvider | null = null;
  readonly enrichCalls: EnrichInput[] = [];
  hashCallCount = 0;

  constructor(provider?: ResultProvider) {
    if (provider !== undefined) this.provider = provider;
  }

  async enrich(input: EnrichInput): Promise<EnrichmentResult> {
    this.enrichCalls.push(input);
    if (!this.provider) {
      throw new Error("FakeLeadEnricher: no result configured (call setEnrichment first)");
    }
    const result = typeof this.provider === "function" ? this.provider(input) : this.provider;
    // Ensure promptHash matches what computePromptHash would return for this input
    // unless the test explicitly overrode it.
    return { ...result, promptHash: result.promptHash || this.computePromptHash(input) };
  }

  computePromptHash(input: EnrichInput): string {
    this.hashCallCount += 1;
    return stableHash(input);
  }

  // ── test helpers ──
  setEnrichment(provider: ResultProvider): void {
    this.provider = provider;
  }
  clear(): void {
    this.provider = null;
    this.enrichCalls.length = 0;
    this.hashCallCount = 0;
  }
}

function stableHash(input: unknown): string {
  const json = JSON.stringify(input, (_k, v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[key] = (v as Record<string, unknown>)[key];
      }
      return sorted;
    }
    return v;
  });
  let h = 0;
  for (let i = 0; i < json.length; i += 1) {
    h = (h * 31 + json.charCodeAt(i)) | 0;
  }
  return `fake-${(h >>> 0).toString(16)}`;
}
