import type { WebsiteSnapshotCache } from "../../ports/WebsiteSnapshotCache";
import type { WebsiteSnapshot } from "../../ports/types";

export class InMemoryWebsiteSnapshotCache implements WebsiteSnapshotCache {
  private readonly store = new Map<string, WebsiteSnapshot>();

  async get(url: string): Promise<WebsiteSnapshot | null> {
    return this.store.get(url) ?? null;
  }

  async set(snapshot: WebsiteSnapshot): Promise<void> {
    this.store.set(snapshot.url, snapshot);
  }

  // ── test helpers ──
  count(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
}
