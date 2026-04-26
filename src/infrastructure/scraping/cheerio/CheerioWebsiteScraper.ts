import { load } from "cheerio";
import robotsParser from "robots-parser";
import type { WebsiteScraper } from "@/src/application/ports/WebsiteScraper";
import type { Clock } from "@/src/application/ports/Clock";
import type { WebsiteSnapshot } from "@/src/application/ports/types";

const DEFAULT_USER_AGENT = "Athena-DealProof/0.1 (+hackathon)";
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_BODY_BYTES = 1_500_000;

export interface CheerioScraperOptions {
  fetchImpl?: typeof fetch;
  clock: Clock;
  userAgent?: string;
  timeoutMs?: number;
}

export class CheerioWebsiteScraper implements WebsiteScraper {
  private readonly fetchImpl: typeof fetch;
  private readonly clock: Clock;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(opts: CheerioScraperOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.clock = opts.clock;
    this.userAgent = opts.userAgent ?? DEFAULT_USER_AGENT;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async scrape(url: string): Promise<WebsiteSnapshot> {
    const target = new URL(url);

    // robots.txt politeness check (fail-open on fetch errors, fail-closed on disallow)
    let robotsAllowed = true;
    try {
      const robotsUrl = `${target.origin}/robots.txt`;
      const robotsResp = await this.fetchWithTimeout(robotsUrl);
      if (robotsResp.ok) {
        const robotsTxt = await robotsResp.text();
        const robots = robotsParser(robotsUrl, robotsTxt);
        if (robots.isAllowed(url, this.userAgent) === false) {
          robotsAllowed = false;
        }
      }
    } catch {
      // No robots.txt or fetch failed → assume allowed (best-effort).
    }
    if (!robotsAllowed) {
      throw new Error(`robots.txt disallows ${url}`);
    }

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Scrape ${response.status} ${response.statusText}: ${url}`);
    }

    const buf = await readWithLimit(response.body, MAX_BODY_BYTES);
    const html = buf.toString("utf8");
    const $ = load(html);

    const title = $("title").first().text().trim() || null;
    const description = $('meta[name="description"]').attr("content")?.trim() || null;
    const h1s = $("h1")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((s) => s.length > 0)
      .slice(0, 8);
    const h2s = $("h2")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((s) => s.length > 0)
      .slice(0, 16);

    const emails = uniq(
      Array.from(html.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)).map((m) => m[0]),
    ).slice(0, 10);

    const socialLinks = uniq(
      $("a")
        .map((_, el) => $(el).attr("href") ?? "")
        .get()
        .filter((href) =>
          /(linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|github\.com)/i.test(
            href,
          ),
        ),
    ).slice(0, 12);

    return {
      url,
      title,
      description,
      h1s,
      h2s,
      emails,
      socialLinks,
      fetchedAt: this.clock.now(),
    };
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, {
        headers: { "User-Agent": this.userAgent, Accept: "text/html,application/xhtml+xml" },
        signal: controller.signal,
        redirect: "follow",
      });
    } finally {
      clearTimeout(t);
    }
  }
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

async function readWithLimit(
  body: ReadableStream<Uint8Array> | null,
  max: number,
): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > max) throw new Error(`Response exceeds ${max} bytes`);
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}
