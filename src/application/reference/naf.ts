// NAF rév. 2 (2008) — INSEE official classification.
// Source: https://www.insee.fr/fr/information/2406147
// Two granularities exposed:
//   - SECTIONS: 21 top-level letter codes (A–U). Used for thesis sector selection.
//   - DIVISIONS: 88 two-digit codes. Forwarded to the Sirene `activite_principale`
//     filter as a prefix when a thesis sector is queried.
// The full 732-code list is intentionally NOT embedded; division-level granularity
// is what the Sirene API exposes for prefix matching, and is what a PE SME thesis
// realistically targets.

export interface NafSection {
  readonly code: string;
  readonly label: string;
}

export interface NafDivision {
  readonly code: string;
  readonly section: string;
  readonly label: string;
}

export const NAF_SECTIONS: readonly NafSection[] = [
  { code: "A", label: "Agriculture, sylviculture et pêche" },
  { code: "B", label: "Industries extractives" },
  { code: "C", label: "Industrie manufacturière" },
  { code: "D", label: "Production et distribution d'électricité, de gaz, de vapeur" },
  { code: "E", label: "Eau, assainissement, gestion des déchets, dépollution" },
  { code: "F", label: "Construction" },
  { code: "G", label: "Commerce ; réparation d'automobiles et de motocycles" },
  { code: "H", label: "Transports et entreposage" },
  { code: "I", label: "Hébergement et restauration" },
  { code: "J", label: "Information et communication" },
  { code: "K", label: "Activités financières et d'assurance" },
  { code: "L", label: "Activités immobilières" },
  { code: "M", label: "Activités spécialisées, scientifiques et techniques" },
  { code: "N", label: "Activités de services administratifs et de soutien" },
  { code: "O", label: "Administration publique" },
  { code: "P", label: "Enseignement" },
  { code: "Q", label: "Santé humaine et action sociale" },
  { code: "R", label: "Arts, spectacles et activités récréatives" },
  { code: "S", label: "Autres activités de services" },
  { code: "T", label: "Activités des ménages en tant qu'employeurs" },
  { code: "U", label: "Activités extra-territoriales" },
] as const;

export const NAF_DIVISIONS: readonly NafDivision[] = [
  { code: "01", section: "A", label: "Culture et production animale, chasse" },
  { code: "02", section: "A", label: "Sylviculture et exploitation forestière" },
  { code: "03", section: "A", label: "Pêche et aquaculture" },
  { code: "05", section: "B", label: "Extraction de houille et de lignite" },
  { code: "06", section: "B", label: "Extraction d'hydrocarbures" },
  { code: "07", section: "B", label: "Extraction de minerais métalliques" },
  { code: "08", section: "B", label: "Autres industries extractives" },
  { code: "09", section: "B", label: "Services de soutien aux industries extractives" },
  { code: "10", section: "C", label: "Industries alimentaires" },
  { code: "11", section: "C", label: "Fabrication de boissons" },
  { code: "12", section: "C", label: "Fabrication de produits à base de tabac" },
  { code: "13", section: "C", label: "Fabrication de textiles" },
  { code: "14", section: "C", label: "Industrie de l'habillement" },
  { code: "15", section: "C", label: "Industrie du cuir et de la chaussure" },
  { code: "16", section: "C", label: "Travail du bois et fabrication d'articles en bois" },
  { code: "17", section: "C", label: "Industrie du papier et du carton" },
  { code: "18", section: "C", label: "Imprimerie et reproduction d'enregistrements" },
  { code: "19", section: "C", label: "Cokéfaction et raffinage" },
  { code: "20", section: "C", label: "Industrie chimique" },
  { code: "21", section: "C", label: "Industrie pharmaceutique" },
  { code: "22", section: "C", label: "Fabrication de produits en caoutchouc et en plastique" },
  { code: "23", section: "C", label: "Fabrication d'autres produits minéraux non métalliques" },
  { code: "24", section: "C", label: "Métallurgie" },
  { code: "25", section: "C", label: "Fabrication de produits métalliques" },
  { code: "26", section: "C", label: "Produits informatiques, électroniques et optiques" },
  { code: "27", section: "C", label: "Fabrication d'équipements électriques" },
  { code: "28", section: "C", label: "Fabrication de machines et équipements n.c.a." },
  { code: "29", section: "C", label: "Industrie automobile" },
  { code: "30", section: "C", label: "Fabrication d'autres matériels de transport" },
  { code: "31", section: "C", label: "Fabrication de meubles" },
  { code: "32", section: "C", label: "Autres industries manufacturières" },
  { code: "33", section: "C", label: "Réparation et installation de machines et équipements" },
  { code: "35", section: "D", label: "Électricité, gaz, vapeur et air conditionné" },
  { code: "36", section: "E", label: "Captage, traitement et distribution d'eau" },
  { code: "37", section: "E", label: "Collecte et traitement des eaux usées" },
  { code: "38", section: "E", label: "Collecte et traitement des déchets ; récupération" },
  { code: "39", section: "E", label: "Dépollution et autres services de gestion des déchets" },
  { code: "41", section: "F", label: "Construction de bâtiments" },
  { code: "42", section: "F", label: "Génie civil" },
  { code: "43", section: "F", label: "Travaux de construction spécialisés" },
  { code: "45", section: "G", label: "Commerce et réparation d'automobiles et de motocycles" },
  { code: "46", section: "G", label: "Commerce de gros" },
  { code: "47", section: "G", label: "Commerce de détail" },
  { code: "49", section: "H", label: "Transports terrestres et transport par conduites" },
  { code: "50", section: "H", label: "Transports par eau" },
  { code: "51", section: "H", label: "Transports aériens" },
  { code: "52", section: "H", label: "Entreposage et services auxiliaires des transports" },
  { code: "53", section: "H", label: "Activités de poste et de courrier" },
  { code: "55", section: "I", label: "Hébergement" },
  { code: "56", section: "I", label: "Restauration" },
  { code: "58", section: "J", label: "Édition" },
  { code: "59", section: "J", label: "Production cinéma, vidéo, TV ; enregistrement sonore" },
  { code: "60", section: "J", label: "Programmation et diffusion" },
  { code: "61", section: "J", label: "Télécommunications" },
  { code: "62", section: "J", label: "Programmation, conseil et autres activités informatiques" },
  { code: "63", section: "J", label: "Services d'information" },
  { code: "64", section: "K", label: "Services financiers (hors assurance et retraite)" },
  { code: "65", section: "K", label: "Assurance" },
  {
    code: "66",
    section: "K",
    label: "Activités auxiliaires de services financiers et d'assurance",
  },
  { code: "68", section: "L", label: "Activités immobilières" },
  { code: "69", section: "M", label: "Activités juridiques et comptables" },
  { code: "70", section: "M", label: "Activités des sièges sociaux ; conseil de gestion" },
  { code: "71", section: "M", label: "Architecture, ingénierie, contrôle et analyses techniques" },
  { code: "72", section: "M", label: "Recherche-développement scientifique" },
  { code: "73", section: "M", label: "Publicité et études de marché" },
  { code: "74", section: "M", label: "Autres activités spécialisées, scientifiques et techniques" },
  { code: "75", section: "M", label: "Activités vétérinaires" },
  { code: "77", section: "N", label: "Location et location-bail" },
  { code: "78", section: "N", label: "Activités liées à l'emploi" },
  { code: "79", section: "N", label: "Agences de voyage, voyagistes, services de réservation" },
  { code: "80", section: "N", label: "Enquêtes et sécurité" },
  { code: "81", section: "N", label: "Services aux bâtiments et aménagement paysager" },
  {
    code: "82",
    section: "N",
    label: "Activités administratives et autres soutiens aux entreprises",
  },
  { code: "84", section: "O", label: "Administration publique et défense ; sécurité sociale" },
  { code: "85", section: "P", label: "Enseignement" },
  { code: "86", section: "Q", label: "Activités pour la santé humaine" },
  { code: "87", section: "Q", label: "Hébergement médico-social et social" },
  { code: "88", section: "Q", label: "Action sociale sans hébergement" },
  { code: "90", section: "R", label: "Activités créatives, artistiques et de spectacle" },
  {
    code: "91",
    section: "R",
    label: "Bibliothèques, archives, musées, autres activités culturelles",
  },
  { code: "92", section: "R", label: "Jeux de hasard et d'argent" },
  { code: "93", section: "R", label: "Activités sportives, récréatives et de loisirs" },
  { code: "94", section: "S", label: "Activités des organisations associatives" },
  { code: "95", section: "S", label: "Réparation d'ordinateurs et de biens personnels" },
  { code: "96", section: "S", label: "Autres services personnels" },
  { code: "97", section: "T", label: "Activités des ménages employeurs de personnel domestique" },
  { code: "98", section: "T", label: "Production indifférenciée des ménages pour usage propre" },
  { code: "99", section: "U", label: "Organisations et organismes extraterritoriaux" },
] as const;

const DIVISION_CODES: ReadonlySet<string> = new Set(NAF_DIVISIONS.map((d) => d.code));
const SECTION_CODES: ReadonlySet<string> = new Set(NAF_SECTIONS.map((s) => s.code));

export function isValidNafDivision(code: string): boolean {
  return DIVISION_CODES.has(code);
}

export function isValidNafSection(code: string): boolean {
  return SECTION_CODES.has(code);
}

export function getNafDivision(code: string): NafDivision | null {
  return NAF_DIVISIONS.find((d) => d.code === code) ?? null;
}
