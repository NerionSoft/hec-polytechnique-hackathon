import type { DocCategory } from "@prisma/client";

const KEYWORDS: Record<string, DocCategory> = {
  // Financial
  financial: "FINANCIAL",
  finances: "FINANCIAL",
  finance: "FINANCIAL",
  "p&l": "FINANCIAL",
  ebitda: "FINANCIAL",
  audit: "FINANCIAL",
  audited: "FINANCIAL",
  accounts: "FINANCIAL",
  accounting: "FINANCIAL",
  comptable: "FINANCIAL",
  compta: "FINANCIAL",
  // Legal
  legal: "LEGAL",
  juridique: "LEGAL",
  contracts: "LEGAL",
  contrats: "LEGAL",
  contract: "LEGAL",
  contrat: "LEGAL",
  insurance: "LEGAL",
  assurance: "LEGAL",
  litigation: "LEGAL",
  litige: "LEGAL",
  ip: "LEGAL",
  trademark: "LEGAL",
  patent: "LEGAL",
  brevet: "LEGAL",
  // Commercial
  commercial: "COMMERCIAL",
  sales: "COMMERCIAL",
  ventes: "COMMERCIAL",
  marketing: "COMMERCIAL",
  business: "COMMERCIAL",
  cim: "COMMERCIAL",
  teaser: "COMMERCIAL",
  pitch: "COMMERCIAL",
  // HR
  hr: "HR",
  rh: "HR",
  "human-resources": "HR",
  "ressources-humaines": "HR",
  headcount: "HR",
  payroll: "HR",
  paie: "HR",
  org: "HR",
  organigram: "HR",
  // Tax
  tax: "TAX",
  taxes: "TAX",
  fiscal: "TAX",
  fiscalite: "TAX",
  vat: "TAX",
  tva: "TAX",
};

/**
 * Infer DocCategory from a relative path inside an uploaded folder.
 * Returns null when no signal is found — caller stores `category: null`,
 * leaving the document available for AI re-classification later.
 *
 * Examples:
 *   "Financial/2024/PL.pdf"            → FINANCIAL
 *   "01_Legal/Contracts/NDA.pdf"       → LEGAL
 *   "HR/Headcount.xlsx"                → HR
 *   "Random/Some_File.pdf"             → null
 */
export function categorize(relativePath: string): DocCategory | null {
  const segments = relativePath.toLowerCase().split(/[\\/]/).filter(Boolean);

  for (const segment of segments) {
    const cleaned = segment.replace(/^\d+[\s_-]*/, "").replace(/[\s_]/g, "-");

    if (KEYWORDS[cleaned]) return KEYWORDS[cleaned];

    for (const [kw, cat] of Object.entries(KEYWORDS)) {
      if (cleaned.includes(kw)) return cat;
    }
  }

  return null;
}
