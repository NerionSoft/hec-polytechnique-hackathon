import type { CompanyDataSource } from "@/src/application/ports/CompanyDataSource";
import type { RawCompanyRecord, SireneSearchQuery } from "@/src/application/ports/types";

const DEFAULT_BASE_URL = "https://recherche-entreprises.api.gouv.fr";
const DEFAULT_PER_PAGE = 25;
// API hard limit per docs — values above 25 trigger HTTP 400.
const MAX_PER_PAGE = 25;

interface SireneApiResult {
  results: SireneCompany[];
  total_results?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

interface SireneCompany {
  siren: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  activite_principale?: string;
  tranche_effectif_salarie?: string;
  date_creation?: string;
  nature_juridique?: string;
  siege?: {
    code_postal?: string;
    ville?: string;
    adresse?: string;
    siret?: string;
  };
  dirigeants?: Array<{
    nom?: string;
    prenoms?: string;
    qualite?: string;
  }>;
  matching_etablissements?: Array<{ siret?: string }>;
}

export interface SireneAdapterOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  userAgent?: string;
}

export class SireneCompanyDataSource implements CompanyDataSource {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;

  constructor(opts: SireneAdapterOptions = {}) {
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.userAgent = opts.userAgent ?? "Athena-DealProof/0.1 (+hackathon)";
  }

  async search(query: SireneSearchQuery): Promise<RawCompanyRecord[]> {
    const params = new URLSearchParams();
    if (query.sectors?.length) {
      // API expects full NAF rev2 class codes in format "XX.XXY" (e.g. "62.01Z").
      params.set("activite_principale", query.sectors.join(","));
    }
    if (query.sections?.length) {
      // API expects single letters A–U.
      params.set("section_activite_principale", query.sections.join(","));
    }
    if (query.postalCodes?.length) {
      // Must be full 5-digit codes; the API rejects 2-digit prefixes.
      params.set("code_postal", query.postalCodes.join(","));
    }
    if (query.departements?.length) {
      // INSEE département codes (2-3 chars, incl. "2A"/"2B" and DOM "971"–"976").
      params.set("departement", query.departements.join(","));
    }
    if (query.employeeBracketCodes?.length) {
      params.set("tranche_effectif_salarie", query.employeeBracketCodes.join(","));
    }
    if (query.legalFormCodes?.length) {
      params.set("nature_juridique", query.legalFormCodes.join(","));
    }
    const perPage = Math.min(query.perPage ?? DEFAULT_PER_PAGE, MAX_PER_PAGE);
    params.set("page", String(query.page ?? 1));
    params.set("per_page", String(perPage));

    const url = `${this.baseUrl}/search?${params.toString()}`;

    const response = await this.fetchImpl(url, {
      headers: { "User-Agent": this.userAgent, Accept: "application/json" },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const detail = body ? ` — ${body.slice(0, 300)}` : "";
      throw new Error(`Sirene API ${response.status} ${response.statusText}: ${url}${detail}`);
    }

    const json = (await response.json()) as SireneApiResult;
    return (json.results ?? []).map((c) => this.toRawRecord(c));
  }

  private toRawRecord(c: SireneCompany): RawCompanyRecord {
    const founder = c.dirigeants?.find((d) =>
      /président|directeur|gérant|dirigeant/i.test(d.qualite ?? ""),
    );
    const founderName = founder
      ? [founder.prenoms, founder.nom].filter(Boolean).join(" ").trim() || null
      : null;

    return {
      source: "SIRENE",
      sourceRef: c.siren,
      companyName: c.nom_complet ?? c.nom_raison_sociale ?? `SIREN ${c.siren}`,
      legalName: c.nom_raison_sociale ?? null,
      website: null,
      country: "FR",
      sector: c.activite_principale ?? null,
      napCode: c.activite_principale ?? null,
      employeeCount: parseEmployeeBracket(c.tranche_effectif_salarie),
      estimatedRevenueEur: null,
      founderName,
    };
  }
}

// Tranche INSEE → midpoint employee count (best-effort proxy).
const TRANCHE_TO_MIDPOINT: Record<string, number> = {
  "00": 0,
  "01": 2,
  "02": 4,
  "03": 8,
  "11": 15,
  "12": 35,
  "21": 75,
  "22": 150,
  "31": 225,
  "32": 375,
  "41": 750,
  "42": 1500,
  "51": 3500,
  "52": 7500,
  "53": 15000,
};

function parseEmployeeBracket(code: string | undefined): number | null {
  if (!code) return null;
  return TRANCHE_TO_MIDPOINT[code] ?? null;
}
