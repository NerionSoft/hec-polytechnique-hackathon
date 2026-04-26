export type LeadSource =
  | "Pitchbook"
  | "Dealroom"
  | "Sourcescrub"
  | "LinkedIn"
  | "Broker"
  | "France Invest";

export type Lead = {
  id: string;
  name: string;
  sector: string;
  geo: string;
  flag: string;
  revenue: number;
  growth: number;
  ebitdaMargin: number;
  founded: number;
  headcount: number;
  score: number | null;
  source: LeadSource;
  status: "new" | "enriched" | "scored" | "promoted" | "dismissed";
  ingestedAt: string;
  ownership?: string;
  lastRound?: string;
  glassdoor?: number;
};

export const leadSources = [
  { id: "s1", name: "Pitchbook", type: "database", active: true, newToday: 12 },
  { id: "s2", name: "Dealroom", type: "database", active: true, newToday: 8 },
  { id: "s3", name: "Sourcescrub", type: "database", active: true, newToday: 5 },
  { id: "s4", name: "LinkedIn", type: "social", active: true, newToday: 14 },
  { id: "s5", name: "Broker", type: "inbox", active: true, newToday: 3 },
  { id: "s6", name: "France Invest", type: "newsletter", active: true, newToday: 2 },
] as const;

export const leads: Lead[] = [
  {
    id: "lead-dataroom",
    name: "DataRoom GmbH",
    sector: "B2B SaaS · DevOps tooling",
    geo: "DE",
    flag: "🇩🇪",
    revenue: 38.0,
    growth: 0.47,
    ebitdaMargin: 0.15,
    founded: 2017,
    headcount: 142,
    score: 91,
    source: "Broker",
    status: "scored",
    ingestedAt: "2026-04-25T07:14:00Z",
    ownership: "Founders 35% / Investors 52% / ESOP 13%",
    lastRound: "Series B €18M, 2024-09 (lead Project A)",
    glassdoor: 4.2,
  },
  {
    id: "lead-nordicai",
    name: "NordicAI ApS",
    sector: "Healthtech · Diagnostic AI",
    geo: "DK",
    flag: "🇩🇰",
    revenue: 19.4,
    growth: 0.62,
    ebitdaMargin: 0.08,
    founded: 2019,
    headcount: 78,
    score: 84,
    source: "Dealroom",
    status: "scored",
    ingestedAt: "2026-04-25T06:50:00Z",
  },
  {
    id: "lead-finserve",
    name: "FinServe SAS",
    sector: "Fintech · B2B treasury",
    geo: "FR",
    flag: "🇫🇷",
    revenue: 27.1,
    growth: 0.34,
    ebitdaMargin: 0.21,
    founded: 2016,
    headcount: 96,
    score: 79,
    source: "Pitchbook",
    status: "scored",
    ingestedAt: "2026-04-24T19:10:00Z",
  },
  {
    id: "lead-agriboost",
    name: "AgriBoost SL",
    sector: "Agritech · Spain",
    geo: "ES",
    flag: "🇪🇸",
    revenue: 11.4,
    growth: 0.51,
    ebitdaMargin: 0.09,
    founded: 2020,
    headcount: 48,
    score: 62,
    source: "LinkedIn",
    status: "enriched",
    ingestedAt: "2026-04-25T05:40:00Z",
  },
  {
    id: "lead-clearbridge",
    name: "ClearBridge Logistics",
    sector: "Industrial · Cross-border",
    geo: "NL",
    flag: "🇳🇱",
    revenue: 51.0,
    growth: 0.14,
    ebitdaMargin: 0.18,
    founded: 2007,
    headcount: 312,
    score: 73,
    source: "Sourcescrub",
    status: "scored",
    ingestedAt: "2026-04-24T15:00:00Z",
  },
  {
    id: "lead-petitlux",
    name: "PetitLux Cosmetics",
    sector: "Consumer · D2C beauty",
    geo: "FR",
    flag: "🇫🇷",
    revenue: 14.6,
    growth: 0.58,
    ebitdaMargin: 0.06,
    founded: 2021,
    headcount: 52,
    score: 58,
    source: "France Invest",
    status: "scored",
    ingestedAt: "2026-04-24T11:20:00Z",
  },
  {
    id: "lead-mediabridge",
    name: "MediaBridge AB",
    sector: "B2B SaaS · MarTech",
    geo: "SE",
    flag: "🇸🇪",
    revenue: 22.8,
    growth: 0.29,
    ebitdaMargin: 0.16,
    founded: 2014,
    headcount: 87,
    score: 76,
    source: "Pitchbook",
    status: "scored",
    ingestedAt: "2026-04-24T09:30:00Z",
  },
  {
    id: "lead-precisionvet",
    name: "PrecisionVet GmbH",
    sector: "Healthtech · Vet imaging",
    geo: "DE",
    flag: "🇩🇪",
    revenue: 16.2,
    growth: 0.39,
    ebitdaMargin: 0.14,
    founded: 2018,
    headcount: 64,
    score: 81,
    source: "Dealroom",
    status: "scored",
    ingestedAt: "2026-04-23T22:00:00Z",
  },
  {
    id: "lead-bitfortress",
    name: "BitFortress SAS",
    sector: "Cybersecurity · IAM",
    geo: "FR",
    flag: "🇫🇷",
    revenue: 24.5,
    growth: 0.43,
    ebitdaMargin: 0.19,
    founded: 2017,
    headcount: 102,
    score: 86,
    source: "Broker",
    status: "scored",
    ingestedAt: "2026-04-23T16:45:00Z",
  },
  {
    id: "lead-greenleaf",
    name: "GreenLeaf Energy BV",
    sector: "Cleantech · Solar O&M",
    geo: "NL",
    flag: "🇳🇱",
    revenue: 33.2,
    growth: 0.21,
    ebitdaMargin: 0.17,
    founded: 2013,
    headcount: 138,
    score: 70,
    source: "Sourcescrub",
    status: "scored",
    ingestedAt: "2026-04-23T14:00:00Z",
  },
];

export function getLead(id: string): Lead | undefined {
  return leads.find((l) => l.id === id);
}

export type ScoreBreakdown = {
  axis: string;
  score: number;
  max: number;
  rationale: string;
};

export function scoreBreakdown(lead: Lead): ScoreBreakdown[] {
  return [
    {
      axis: "Sector fit",
      score: lead.score && lead.score > 80 ? 25 : 18,
      max: 25,
      rationale: `${lead.sector} · ${lead.score && lead.score > 80 ? "core thesis match" : "adjacent"}`,
    },
    {
      axis: "Size fit",
      score: lead.revenue >= 15 && lead.revenue <= 80 ? 22 : 12,
      max: 25,
      rationale: `€${lead.revenue.toFixed(1)}M revenue · ${lead.revenue >= 15 && lead.revenue <= 80 ? "in target range €15–80M" : "outside primary range"}`,
    },
    {
      axis: "Growth",
      score: lead.growth >= 0.4 ? 18 : lead.growth >= 0.25 ? 14 : 8,
      max: 20,
      rationale: `${(lead.growth * 100).toFixed(0)}% YoY · ${lead.growth >= 0.2 ? "above thesis floor" : "below thesis floor"}`,
    },
    {
      axis: "Geo fit",
      score: ["FR", "DE", "NL", "BE", "DK", "SE"].includes(lead.geo) ? 20 : 14,
      max: 20,
      rationale: `${lead.geo} · ${["FR", "DE"].includes(lead.geo) ? "core market" : "adjacent market"}`,
    },
    {
      axis: "Profitability",
      score: lead.ebitdaMargin >= 0.15 ? 12 : 8,
      max: 15,
      rationale: `${(lead.ebitdaMargin * 100).toFixed(0)}% EBITDA margin · ${lead.ebitdaMargin >= 0.15 ? "above thesis floor" : "below thesis floor"}`,
    },
    {
      axis: "Risk flags",
      score: lead.score === 91 ? -4 : 0,
      max: -10,
      rationale:
        lead.score === 91
          ? "Recent CTO change (joined Q3 2025) — leadership stability uncertain"
          : "No material flags from enrichment data",
    },
  ];
}
