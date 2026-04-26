// Tranches d'effectif salarié — INSEE codes used by the Sirene API.
// Source: https://www.sirene.fr/sirene/public/static/codes-effectifs
// These are the exact code values accepted by `tranche_effectif_salarie` on the
// recherche-entreprises API. Do not invent new codes.

export interface EffectifBracket {
  readonly code: string;
  readonly label: string;
  readonly midpoint: number | null; // null when "non-employeur" (NN, 00)
}

export const EFFECTIF_BRACKETS: readonly EffectifBracket[] = [
  { code: "NN", label: "Unités non employeuses", midpoint: null },
  { code: "00", label: "0 salarié", midpoint: 0 },
  { code: "01", label: "1 ou 2 salariés", midpoint: 2 },
  { code: "02", label: "3 à 5 salariés", midpoint: 4 },
  { code: "03", label: "6 à 9 salariés", midpoint: 8 },
  { code: "11", label: "10 à 19 salariés", midpoint: 15 },
  { code: "12", label: "20 à 49 salariés", midpoint: 35 },
  { code: "21", label: "50 à 99 salariés", midpoint: 75 },
  { code: "22", label: "100 à 199 salariés", midpoint: 150 },
  { code: "31", label: "200 à 249 salariés", midpoint: 225 },
  { code: "32", label: "250 à 499 salariés", midpoint: 375 },
  { code: "41", label: "500 à 999 salariés", midpoint: 750 },
  { code: "42", label: "1 000 à 1 999 salariés", midpoint: 1500 },
  { code: "51", label: "2 000 à 4 999 salariés", midpoint: 3500 },
  { code: "52", label: "5 000 à 9 999 salariés", midpoint: 7500 },
  { code: "53", label: "10 000 salariés et plus", midpoint: 15000 },
] as const;

const CODES: ReadonlySet<string> = new Set(EFFECTIF_BRACKETS.map((b) => b.code));

export function isValidEffectifCode(code: string): boolean {
  return CODES.has(code);
}

export function getEffectifBracket(code: string): EffectifBracket | null {
  return EFFECTIF_BRACKETS.find((b) => b.code === code) ?? null;
}
