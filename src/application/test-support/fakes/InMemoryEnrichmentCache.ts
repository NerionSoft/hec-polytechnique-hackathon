import type { EnrichmentCache } from "../../ports/LeadEnricher";
import type { EnrichmentResult } from "../../ports/types";

export class InMemoryEnrichmentCache implements EnrichmentCache {
  private readonly store = new Map<string, EnrichmentResult>();

  async get(promptHash: string): Promise<EnrichmentResult | null> {
    return this.store.get(promptHash) ?? null;
  }

  async set(result: EnrichmentResult): Promise<void> {
    this.store.set(result.promptHash, result);
  }

  // ── test helpers ──
  count(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  has(promptHash: string): boolean {
    return this.store.has(promptHash);
  }
}
