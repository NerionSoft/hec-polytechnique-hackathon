import { describe, expect, it, vi } from "vitest";
import { SireneCompanyDataSource } from "./SireneCompanyDataSource";

const SAMPLE_RESPONSE = {
  results: [
    {
      siren: "552032534",
      nom_complet: "GREENBITE SAS",
      nom_raison_sociale: "GreenBite",
      activite_principale: "62.01Z",
      tranche_effectif_salarie: "12",
      date_creation: "2018-03-15",
      nature_juridique: "5710",
      siege: { code_postal: "75002", ville: "Paris", siret: "55203253400025" },
      dirigeants: [{ nom: "Martin", prenoms: "Sophie", qualite: "Présidente" }],
    },
  ],
};

describe("SireneCompanyDataSource", () => {
  it("maps API response to RawCompanyRecord with employee bracket midpoint", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify(SAMPLE_RESPONSE), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    const source = new SireneCompanyDataSource({ fetchImpl });
    const records = await source.search({
      sectors: ["62.01Z"],
      employeeBracketCodes: ["12"],
      page: 1,
      perPage: 10,
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      source: "SIRENE",
      sourceRef: "552032534",
      companyName: "GREENBITE SAS",
      country: "FR",
      napCode: "62.01Z",
      employeeCount: 35, // tranche "12" → midpoint 35
      founderName: "Sophie Martin",
    });
  });

  it("builds the request URL with all filters and User-Agent", async () => {
    let capturedUrl = "";
    let capturedHeaders: Headers | null = null;
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as unknown as typeof fetch;

    const source = new SireneCompanyDataSource({ fetchImpl });
    await source.search({
      sectors: ["62.01Z", "62.02A"],
      postalCodes: ["75002"],
      employeeBracketCodes: ["12"],
      legalFormCodes: ["5710"],
      page: 2,
      perPage: 25,
    });

    expect(capturedUrl).toContain("activite_principale=62.01Z%2C62.02A");
    expect(capturedUrl).toContain("code_postal=75002");
    expect(capturedUrl).toContain("tranche_effectif_salarie=12");
    expect(capturedUrl).toContain("nature_juridique=5710");
    expect(capturedUrl).toContain("page=2");
    expect(capturedUrl).toContain("per_page=25");
    expect(capturedHeaders!.get("User-Agent")).toContain("Athena-DealProof");
  });

  it("throws on non-2xx response", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
    ) as unknown as typeof fetch;

    const source = new SireneCompanyDataSource({ fetchImpl });
    await expect(source.search({ page: 1 })).rejects.toThrow(/429/);
  });
});
