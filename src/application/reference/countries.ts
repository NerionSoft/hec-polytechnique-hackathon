// Country codes — ISO-3166-1 alpha-2.
// Restricted to EEA + United Kingdom + Switzerland, the realistic perimeter
// for a European lower-mid-market PE fund.
// Source: https://www.iso.org/obp/ui/#search

export interface Country {
  readonly code: string;
  readonly label: string;
}

export const COUNTRIES: readonly Country[] = [
  { code: "AT", label: "Austria" },
  { code: "BE", label: "Belgium" },
  { code: "BG", label: "Bulgaria" },
  { code: "CH", label: "Switzerland" },
  { code: "CY", label: "Cyprus" },
  { code: "CZ", label: "Czechia" },
  { code: "DE", label: "Germany" },
  { code: "DK", label: "Denmark" },
  { code: "EE", label: "Estonia" },
  { code: "ES", label: "Spain" },
  { code: "FI", label: "Finland" },
  { code: "FR", label: "France" },
  { code: "GB", label: "United Kingdom" },
  { code: "GR", label: "Greece" },
  { code: "HR", label: "Croatia" },
  { code: "HU", label: "Hungary" },
  { code: "IE", label: "Ireland" },
  { code: "IS", label: "Iceland" },
  { code: "IT", label: "Italy" },
  { code: "LI", label: "Liechtenstein" },
  { code: "LT", label: "Lithuania" },
  { code: "LU", label: "Luxembourg" },
  { code: "LV", label: "Latvia" },
  { code: "MT", label: "Malta" },
  { code: "NL", label: "Netherlands" },
  { code: "NO", label: "Norway" },
  { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" },
  { code: "RO", label: "Romania" },
  { code: "SE", label: "Sweden" },
  { code: "SI", label: "Slovenia" },
  { code: "SK", label: "Slovakia" },
] as const;

const CODES: ReadonlySet<string> = new Set(COUNTRIES.map((c) => c.code));

export function isValidCountryCode(code: string): boolean {
  return CODES.has(code);
}

export function getCountry(code: string): Country | null {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}
