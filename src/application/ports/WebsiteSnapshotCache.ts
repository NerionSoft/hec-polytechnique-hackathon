import type { WebsiteSnapshot } from "./types";

export interface WebsiteSnapshotCache {
  get(url: string): Promise<WebsiteSnapshot | null>;
  set(snapshot: WebsiteSnapshot): Promise<void>;
}
