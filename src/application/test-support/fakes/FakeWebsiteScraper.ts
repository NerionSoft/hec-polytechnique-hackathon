import type { WebsiteScraper } from "../../ports/WebsiteScraper";
import type { WebsiteSnapshot } from "../../ports/types";

export class FakeWebsiteScraper implements WebsiteScraper {
  private readonly snapshots = new Map<string, WebsiteSnapshot>();
  private defaultSnapshot: WebsiteSnapshot | null = null;
  private readonly disallowed = new Set<string>();
  readonly scrapeCalls: string[] = [];

  constructor(snapshots: WebsiteSnapshot[] = []) {
    for (const s of snapshots) this.snapshots.set(s.url, s);
  }

  async scrape(url: string): Promise<WebsiteSnapshot> {
    this.scrapeCalls.push(url);
    if (this.disallowed.has(url)) {
      throw new Error(`disallowed: ${url}`);
    }
    const found = this.snapshots.get(url);
    if (found) return found;
    if (this.defaultSnapshot) return { ...this.defaultSnapshot, url };
    throw new Error(`no snapshot configured for ${url}`);
  }

  // ── test helpers ──
  setSnapshot(snapshot: WebsiteSnapshot): void {
    this.defaultSnapshot = snapshot;
    this.snapshots.set(snapshot.url, snapshot);
  }
  disallow(url: string): void {
    this.disallowed.add(url);
  }
  clear(): void {
    this.snapshots.clear();
    this.disallowed.clear();
    this.defaultSnapshot = null;
    this.scrapeCalls.length = 0;
  }
}
