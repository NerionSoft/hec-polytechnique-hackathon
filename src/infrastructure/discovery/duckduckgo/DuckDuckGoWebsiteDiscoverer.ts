import * as cheerio from "cheerio";
import type {
  WebsiteDiscoverer,
  WebsiteDiscovererInput,
  WebsiteDiscovererResult,
} from "@/src/application/ports/WebsiteDiscoverer";

// DuckDuckGo HTML endpoint — no JS, no auth, no rate limit reachable at hackathon scale.
// We use the "html.duckduckgo.com" host which renders a simple SERP server-side.
const DEFAULT_SEARCH_URL = "https://html.duckduckgo.com/html/";

// Domains we explicitly DON'T want as the company website: aggregators, public
// registries, social profiles, search engines, generic news/wikis.
const EXCLUDED_HOSTS = [
  // Search engines / wrappers
  "duckduckgo.com",
  "google.com",
  "bing.com",
  "yahoo.com",
  // Public French registries / aggregators
  "pappers.fr",
  "societe.com",
  "infogreffe.fr",
  "bodacc.fr",
  "verif.com",
  "manageo.fr",
  "b-reputation.com",
  "dirigeant.com",
  "kompass.com",
  "annuaire-entreprises.data.gouv.fr",
  "recherche-entreprises.api.gouv.fr",
  "data.gouv.fr",
  "insee.fr",
  // Social profiles
  "linkedin.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  // Wikis / generic
  "wikipedia.org",
  "wikidata.org",
  // Job boards
  "indeed.com",
  "glassdoor.com",
  "welcometothejungle.com",
];

const MAX_RESULTS_TO_TRY = 8;

export interface DuckDuckGoWebsiteDiscovererOptions {
  fetchImpl?: typeof fetch;
  searchUrl?: string;
  userAgent?: string;
  // Verify that each candidate URL actually resolves (HEAD request) before
  // returning. Off in tests; on by default in production.
  verifyResolves?: boolean;
}

export class DuckDuckGoWebsiteDiscoverer implements WebsiteDiscoverer {
  private readonly fetchImpl: typeof fetch;
  private readonly searchUrl: string;
  private readonly userAgent: string;
  private readonly verifyResolves: boolean;

  constructor(opts: DuckDuckGoWebsiteDiscovererOptions = {}) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.searchUrl = opts.searchUrl ?? DEFAULT_SEARCH_URL;
    // Mimic a regular browser; some DDG responses degrade for unknown UAs.
    this.userAgent =
      opts.userAgent ??
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
    this.verifyResolves = opts.verifyResolves ?? true;
  }

  async discover(input: WebsiteDiscovererInput): Promise<WebsiteDiscovererResult | null> {
    const query = buildQuery(input);
    const url = `${this.searchUrl}?${new URLSearchParams({ q: query }).toString()}`;

    let html: string;
    try {
      const res = await this.fetchImpl(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
      });
      if (!res.ok) {
        console.warn(`[WebsiteDiscoverer] DDG HTTP ${res.status} for "${query}"`);
        return null;
      }
      html = await res.text();
    } catch (err) {
      console.warn(`[WebsiteDiscoverer] DDG fetch failed:`, (err as Error).message);
      return null;
    }

    const candidates = extractCandidates(html).slice(0, MAX_RESULTS_TO_TRY);
    const slug = nameSlug(input.companyName);

    // Strategy: prefer hostnames that contain the company name slug. If none,
    // fall back to the first non-excluded result.
    let best: { url: string; rationale: string } | null = null;
    for (const candidate of candidates) {
      const host = hostnameOf(candidate);
      if (!host || isExcludedHost(host)) continue;
      if (slug && hostContainsSlug(host, slug)) {
        best = { url: candidate, rationale: `Company name in hostname (${host})` };
        break;
      }
      if (!best) {
        best = { url: candidate, rationale: `First non-aggregator result (${host})` };
      }
    }

    if (!best) return null;

    if (this.verifyResolves) {
      const resolved = await this.headOk(best.url);
      if (!resolved) {
        console.warn(`[WebsiteDiscoverer] candidate ${best.url} did not resolve`);
        return null;
      }
    }

    return {
      url: normalizeUrl(best.url),
      source: "duckduckgo",
      rationale: best.rationale,
    };
  }

  private async headOk(target: string): Promise<boolean> {
    try {
      const res = await this.fetchImpl(target, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": this.userAgent },
      });
      // Some sites reject HEAD; accept 200/300/40x as "exists".
      return res.status < 500;
    } catch {
      return false;
    }
  }
}

function buildQuery(input: WebsiteDiscovererInput): string {
  const parts: string[] = [`"${input.companyName}"`];
  if (input.city) parts.push(input.city);
  if (input.country === "FR") parts.push("site officiel");
  parts.push("-pappers", "-societe", "-linkedin");
  return parts.join(" ");
}

function extractCandidates(html: string): string[] {
  const $ = cheerio.load(html);
  const out: string[] = [];

  // DDG HTML wraps real URLs behind /l/?uddg=<encoded>; the visible link text
  // also exposes them via .result__url, but the href on .result__a is the
  // wrapper. Decode both.
  $("a.result__a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const target = decodeDuckDuckGoTarget(href);
    if (target) out.push(target);
  });

  // Some response variants use plain anchors inside .results.
  if (out.length === 0) {
    $("a").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const target = decodeDuckDuckGoTarget(href) ?? (looksLikeAbsoluteUrl(href) ? href : null);
      if (target) out.push(target);
    });
  }

  return Array.from(new Set(out));
}

function decodeDuckDuckGoTarget(href: string): string | null {
  // Wrapper: //duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com&rut=...
  if (href.startsWith("//duckduckgo.com/l/") || href.startsWith("https://duckduckgo.com/l/")) {
    try {
      const url = new URL(href.startsWith("//") ? `https:${href}` : href);
      const target = url.searchParams.get("uddg");
      return target ? decodeURIComponent(target) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function looksLikeAbsoluteUrl(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isExcludedHost(host: string): boolean {
  return EXCLUDED_HOSTS.some((bad) => host === bad || host.endsWith(`.${bad}`));
}

function nameSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(sa|sas|sasu|sarl|eurl|sci|sci|snc|company|inc|ltd|gmbh)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function hostContainsSlug(host: string, slug: string): boolean {
  if (slug.length < 3) return false;
  const flat = host.replace(/[^a-z0-9]/g, "");
  return flat.includes(slug);
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Drop tracking query params; keep path.
    u.search = "";
    u.hash = "";
    // Always keep https when the host responds — but we don't know here, so leave as-is.
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}
