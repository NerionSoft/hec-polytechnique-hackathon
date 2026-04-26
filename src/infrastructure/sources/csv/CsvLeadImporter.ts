import { parse } from "csv-parse/sync";
import type { RawCompanyRecord } from "@/src/application/ports/types";

export interface CsvImportError {
  line: number;
  reason: string;
}

export interface CsvImportResult {
  records: RawCompanyRecord[];
  errors: CsvImportError[];
}

const REQUIRED_FIELDS = ["companyName"] as const;
const HEADER_ALIASES: Record<string, string> = {
  companyname: "companyName",
  company: "companyName",
  raisonsociale: "companyName",
  legalname: "legalName",
  website: "website",
  url: "website",
  country: "country",
  sector: "sector",
  industry: "sector",
  napcode: "napCode",
  naf: "napCode",
  employeecount: "employeeCount",
  employees: "employeeCount",
  effectif: "employeeCount",
  estimatedrevenue: "estimatedRevenueEur",
  revenue: "estimatedRevenueEur",
  ca: "estimatedRevenueEur",
  founder: "founderName",
  foundername: "founderName",
  fondateur: "founderName",
};

export class CsvLeadImporter {
  parse(buffer: Buffer): CsvImportResult {
    const text = buffer.toString("utf8");
    const delimiter = detectDelimiter(text);
    const rows = parse(text, {
      columns: (header: string[]) => header.map(normalizeKey),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      delimiter,
    }) as Record<string, string>[];

    const records: RawCompanyRecord[] = [];
    const errors: CsvImportError[] = [];

    rows.forEach((row, index) => {
      const lineNumber = index + 2; // header counts as line 1
      const missing = REQUIRED_FIELDS.filter((f) => !row[f]?.trim());
      if (missing.length > 0) {
        errors.push({ line: lineNumber, reason: `Missing required fields: ${missing.join(", ")}` });
        return;
      }

      records.push({
        source: "CSV_IMPORT",
        sourceRef: row.companyName.trim().toLowerCase(),
        companyName: row.companyName.trim(),
        legalName: row.legalName?.trim() || null,
        website: row.website?.trim() || null,
        country: row.country?.trim() || "FR",
        sector: row.sector?.trim() || null,
        napCode: row.napCode?.trim() || null,
        employeeCount: parseIntSafe(row.employeeCount),
        estimatedRevenueEur: parseFloatSafe(row.estimatedRevenueEur),
        founderName: row.founderName?.trim() || null,
      });
    });

    return { records, errors };
  }
}

function normalizeKey(raw: string): string {
  const k = raw
    .replace(/﻿/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return HEADER_ALIASES[k] ?? k;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

function parseIntSafe(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number.parseInt(v.replace(/[\s ]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function parseFloatSafe(v: string | undefined): number | null {
  if (!v) return null;
  const cleaned = v.replace(/[€\s ]/g, "").replace(/,/g, ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
