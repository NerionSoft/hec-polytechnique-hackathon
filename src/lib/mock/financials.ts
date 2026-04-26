export type FinancialsHelios = {
  trend: { period: string; revenue: number; ebitda: number }[];
  ebitdaBridge: {
    label: string;
    value: number;
    type: "base" | "addition" | "warning" | "total";
    note?: string;
  }[];
  customerConcentration: { name: string; share: number; flag?: boolean }[];
  cohortRetention: { period: string; nrr: number; grr: number; churn: number };
  workingCapital: { period: string; dso: number; dpo: number; dio: number }[];
};

export const financialsHelios: FinancialsHelios = {
  trend: [
    { period: "FY20", revenue: 14.8, ebitda: 1.6 },
    { period: "FY21", revenue: 17.5, ebitda: 2.1 },
    { period: "FY22", revenue: 21.2, ebitda: 2.7 },
    { period: "FY23", revenue: 26.3, ebitda: 3.4 },
    { period: "FY24", revenue: 31.0, ebitda: 4.2 },
    { period: "FY25E", revenue: 38.5, ebitda: 5.8 },
  ],
  ebitdaBridge: [
    { label: "Reported EBITDA", value: 4.2, type: "base" },
    { label: "COVID restruct.", value: 0.9, type: "addition", note: "Questionable in 2024" },
    { label: "Consulting fees", value: 0.7, type: "warning", note: "Recurring 3 years in a row" },
    { label: "Pre-IPO costs", value: 0.5, type: "warning", note: "No IPO planned" },
    { label: "Adjusted EBITDA", value: 6.3, type: "total" },
  ],
  customerConcentration: [
    { name: "Carrefour", share: 0.31, flag: true },
    { name: "Auchan", share: 0.19 },
    { name: "Pernod Ricard", share: 0.14 },
    { name: "Carrefour Belgium", share: 0.06 },
    { name: "Casino", share: 0.04 },
    { name: "Other (37)", share: 0.26 },
  ],
  cohortRetention: { period: "FY24", nrr: 1.08, grr: 0.92, churn: 0.08 },
  workingCapital: [
    { period: "FY22", dso: 42, dpo: 51, dio: 38 },
    { period: "FY23", dso: 47, dpo: 49, dio: 41 },
    { period: "FY24", dso: 68, dpo: 47, dio: 44 },
  ],
};
