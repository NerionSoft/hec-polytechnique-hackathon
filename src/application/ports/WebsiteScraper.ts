import type { WebsiteSnapshot } from "./types";

export interface WebsiteScraper {
  scrape(url: string): Promise<WebsiteSnapshot>;
}
