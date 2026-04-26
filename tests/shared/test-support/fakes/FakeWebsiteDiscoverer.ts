import type {
  WebsiteDiscoverer,
  WebsiteDiscovererInput,
  WebsiteDiscovererResult,
} from "@/src/application/ports/WebsiteDiscoverer";

export class FakeWebsiteDiscoverer implements WebsiteDiscoverer {
  readonly discoverCalls: WebsiteDiscovererInput[] = [];
  private byName = new Map<string, WebsiteDiscovererResult | null>();
  private fallback: WebsiteDiscovererResult | null = null;

  setNext(companyName: string, result: WebsiteDiscovererResult | null): void {
    this.byName.set(companyName.toLowerCase(), result);
  }

  setFallback(result: WebsiteDiscovererResult | null): void {
    this.fallback = result;
  }

  async discover(input: WebsiteDiscovererInput): Promise<WebsiteDiscovererResult | null> {
    this.discoverCalls.push(input);
    const key = input.companyName.toLowerCase();
    if (this.byName.has(key)) return this.byName.get(key)!;
    return this.fallback;
  }

  // ── test helpers ──
  clear(): void {
    this.discoverCalls.length = 0;
    this.byName.clear();
    this.fallback = null;
  }
}
