// Catégorie juridique — codes accepted by the Sirene `recherche-entreprises` API.
// The API uses a curated subset of the INSEE nomenclature; not every level-III
// code is whitelisted. Source of truth (verified live, HTTP 200):
// https://raw.githubusercontent.com/annuaire-entreprises-data-gouv-fr/search-api/main/app/labels/natures-juridiques.json
//
// Important INSEE quirks reflected here:
//   - EURL is NOT a separate code: it's a 5499 (SARL) with a single associé.
//   - SASU is NOT a separate code: it's a 5710 (SAS) with a single associé.
//   - 5485 is SELARL (libéral à responsabilité limitée), not EURL.
//
// The list below is the curated PE-relevant subset. The full whitelist has ~260
// entries; we don't expose them all because >95% of operating commercial PME
// targets fall in 5499, 5710, 5599, 5699.

export interface LegalForm {
  readonly code: string;
  readonly label: string;
}

export const LEGAL_FORMS: readonly LegalForm[] = [
  { code: "5499", label: "SARL — Société à responsabilité limitée (incl. EURL)" },
  { code: "5710", label: "SAS — Société par actions simplifiée (incl. SASU)" },
  { code: "5599", label: "SA — Société anonyme à conseil d'administration" },
  { code: "5699", label: "SA — Société anonyme à directoire" },
  { code: "5800", label: "SE — Société européenne" },
  { code: "5202", label: "SNC — Société en nom collectif" },
  { code: "5306", label: "SCS — Société en commandite simple" },
  { code: "5308", label: "SCA — Société en commandite par actions" },
  { code: "5410", label: "SARL nationale" },
  { code: "5485", label: "SELARL — Société d'exercice libéral à responsabilité limitée" },
  { code: "5785", label: "SELAS — Société d'exercice libéral par actions simplifiée" },
  { code: "1000", label: "Entrepreneur individuel" },
  { code: "6540", label: "SCI — Société civile immobilière" },
  { code: "6599", label: "Autre société civile" },
] as const;

const CODES: ReadonlySet<string> = new Set(LEGAL_FORMS.map((f) => f.code));

export function isValidLegalFormCode(code: string): boolean {
  return CODES.has(code);
}

export function getLegalForm(code: string): LegalForm | null {
  return LEGAL_FORMS.find((f) => f.code === code) ?? null;
}
