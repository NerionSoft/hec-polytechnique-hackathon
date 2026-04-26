import { describe, expect, it, vi } from "vitest";
import { CheerioWebsiteScraper } from "./CheerioWebsiteScraper";

const SAMPLE_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <title>Helios AgriTech — Software for sustainable farms</title>
    <meta name="description" content="SaaS platform for European agritech SMEs." />
  </head>
  <body>
    <h1>From farm data to profitability</h1>
    <h2>Subscription plans</h2>
    <h2>Customer stories</h2>
    <p>Contact: hello@helios-agri.tech and sales@helios-agri.tech</p>
    <a href="https://www.linkedin.com/company/helios-agri">LinkedIn</a>
    <a href="https://twitter.com/heliosagri">Twitter</a>
    <a href="/about">About</a>
  </body>
</html>`;

class FixedClock {
  now() {
    return new Date("2026-04-26T10:00:00Z");
  }
}

describe("CheerioWebsiteScraper", () => {
  it("extracts title, description, headings, emails, social links", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = url.toString();
      if (u.endsWith("/robots.txt")) {
        return new Response("User-agent: *\nAllow: /\n", { status: 200 });
      }
      return new Response(SAMPLE_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }) as unknown as typeof fetch;

    const scraper = new CheerioWebsiteScraper({ fetchImpl, clock: new FixedClock() });
    const snapshot = await scraper.scrape("https://helios-agri.tech/");

    expect(snapshot.title).toBe("Helios AgriTech — Software for sustainable farms");
    expect(snapshot.description).toBe("SaaS platform for European agritech SMEs.");
    expect(snapshot.h1s).toEqual(["From farm data to profitability"]);
    expect(snapshot.h2s).toEqual(["Subscription plans", "Customer stories"]);
    expect(snapshot.emails.sort()).toEqual(["hello@helios-agri.tech", "sales@helios-agri.tech"]);
    expect(snapshot.socialLinks).toContain("https://www.linkedin.com/company/helios-agri");
    expect(snapshot.socialLinks).toContain("https://twitter.com/heliosagri");
    expect(snapshot.fetchedAt.toISOString()).toBe("2026-04-26T10:00:00.000Z");
  });

  it("respects robots.txt disallow", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = url.toString();
      if (u.endsWith("/robots.txt")) {
        return new Response("User-agent: *\nDisallow: /\n", { status: 200 });
      }
      return new Response(SAMPLE_HTML, { status: 200 });
    }) as unknown as typeof fetch;

    const scraper = new CheerioWebsiteScraper({ fetchImpl, clock: new FixedClock() });
    await expect(scraper.scrape("https://blocked.example.com/")).rejects.toThrow(/robots\.txt/);
  });

  it("throws on non-2xx page response", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = url.toString();
      if (u.endsWith("/robots.txt")) {
        return new Response("", { status: 404 });
      }
      return new Response("not found", { status: 404, statusText: "Not Found" });
    }) as unknown as typeof fetch;

    const scraper = new CheerioWebsiteScraper({ fetchImpl, clock: new FixedClock() });
    await expect(scraper.scrape("https://missing.example.com/")).rejects.toThrow(/404/);
  });
});
