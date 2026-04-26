export interface WebsiteDiscovererInput {
  companyName: string;
  country: string;
  sector?: string | null;
  city?: string | null;
}

export interface WebsiteDiscovererResult {
  url: string;
  // Where the URL was found (e.g. "duckduckgo"), surfaced in the audit drawer.
  source: string;
  // Free-form short string explaining why this candidate was picked
  // (e.g. "company name in hostname"). Surfaced in the audit drawer.
  rationale: string;
}

export interface WebsiteDiscoverer {
  discover(input: WebsiteDiscovererInput): Promise<WebsiteDiscovererResult | null>;
}
