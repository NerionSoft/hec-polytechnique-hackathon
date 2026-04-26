import { describe, expect, it } from "vitest";
import { CsvLeadImporter } from "./CsvLeadImporter";

describe("CsvLeadImporter", () => {
  it("parses comma-delimited CSV with English headers", () => {
    const csv = `companyName,website,sector,country,employeeCount,estimatedRevenue,founderName
Acme SaaS,https://acme.example,Software,FR,42,8500000,Marie Curie
Beta Industries,https://beta.example,Industrial Services,FR,180,22000000,Jean Pasteur
`;
    const result = new CsvLeadImporter().parse(Buffer.from(csv, "utf8"));
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      source: "CSV_IMPORT",
      companyName: "Acme SaaS",
      website: "https://acme.example",
      sector: "Software",
      country: "FR",
      employeeCount: 42,
      estimatedRevenueEur: 8_500_000,
      founderName: "Marie Curie",
    });
  });

  it("auto-detects semicolon delimiter (French Excel) + French aliases + comma decimal", () => {
    const csv = `Raison Sociale;Website;Effectif;CA;Fondateur
Helios AgriTech;https://helios.example;55;12 500 000,50;Sophie Martin
`;
    const result = new CsvLeadImporter().parse(Buffer.from(csv, "utf8"));
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      companyName: "Helios AgriTech",
      website: "https://helios.example",
      employeeCount: 55,
      estimatedRevenueEur: 12_500_000.5,
      founderName: "Sophie Martin",
    });
  });

  it("strips UTF-8 BOM and skips rows with missing required field", () => {
    const csv = "﻿companyName,website\n,https://nope.example\nValid Co,https://valid.example\n";
    const result = new CsvLeadImporter().parse(Buffer.from(csv, "utf8"));
    expect(result.errors).toEqual([{ line: 2, reason: "Missing required fields: companyName" }]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].companyName).toBe("Valid Co");
  });
});
