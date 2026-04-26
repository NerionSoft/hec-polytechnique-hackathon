import { z } from "zod";
import { EvidenceSchema, GapSchema } from "../shared/evidence";

export const A2_SCHEMA_VERSION = "v1";

const periodMetricSchema = z.object({
  period: z.string(),
  value: z.number().nullable(),
  source_type: z.enum(["audit", "management", "board", "budget"]).optional(),
  conflict: z.boolean().optional(),
  evidence: z.array(EvidenceSchema).max(3),
});

const segmentMetricSchema = z.object({
  period: z.string(),
  segment: z.string(),
  value: z.number().nullable(),
  evidence: z.array(EvidenceSchema).max(2),
});

const dealKpiSyncSchema = z.object({
  revenue_eur: z.number().nullable(),
  ebitda_eur: z.number().nullable(),
  ebitda_margin: z.number().nullable(),
  growth_yoy: z.number().nullable(),
  net_debt_ebitda: z.number().nullable(),
  employees: z.number().int().nullable(),
  founded: z.number().int().nullable(),
  evidence: z.array(EvidenceSchema).max(8),
});

const trendViewItemSchema = z.object({
  period: z.string(),
  revenue_m: z.number(),
  ebitda_m: z.number().nullable(),
  evidence: z.array(EvidenceSchema).max(2),
});

const workingCapitalViewItemSchema = z.object({
  period: z.string(),
  dso: z.number().nullable(),
  dpo: z.number().nullable(),
  dio: z.number().nullable(),
  evidence: z.array(EvidenceSchema).max(2),
});

const kpiViewSchema = z.object({
  revenue_m: z.number().nullable(),
  ebitda_m: z.number().nullable(),
  ebitda_margin: z.number().nullable(),
  growth_yoy: z.number().nullable(),
  net_debt_ebitda: z.number().nullable(),
  headcount: z.number().int().nullable(),
  client_count: z.number().int().nullable(),
  evidence: z.array(EvidenceSchema).max(6),
});

export const A2OutputSchema = z.object({
  period_covered: z.object({
    from: z.string(),
    to: z.string(),
  }),
  currency: z.enum(["EUR", "USD", "GBP"]),

  // Niveau 1 — audit / replay
  p_and_l: z.object({
    revenue: z.array(periodMetricSchema),
    revenue_by_segment: z.array(segmentMetricSchema).default([]),
    gross_profit: z.array(periodMetricSchema).default([]),
    gross_margin_pct: z.array(periodMetricSchema).default([]),
    ebitda: z.array(periodMetricSchema),
    ebitda_margin_pct: z.array(periodMetricSchema).default([]),
    ebit: z.array(periodMetricSchema).default([]),
    net_income: z.array(periodMetricSchema).default([]),
  }),
  balance_sheet: z.object({
    total_assets: z.array(periodMetricSchema).default([]),
    cash: z.array(periodMetricSchema).default([]),
    total_debt: z.array(periodMetricSchema).default([]),
    working_capital: z.array(periodMetricSchema).default([]),
    current_ratio: z.array(periodMetricSchema).default([]),
  }),
  cash_flow: z.object({
    operating_cf: z.array(periodMetricSchema).default([]),
    capex: z.array(periodMetricSchema).default([]),
    fcf: z.array(periodMetricSchema).default([]),
  }),
  growth_kpis: z.object({
    yoy_revenue_growth_pct: z.array(periodMetricSchema).default([]),
    headcount: z.array(periodMetricSchema).default([]),
    client_count: z.array(periodMetricSchema).default([]),
    retention_rate_pct: z.array(periodMetricSchema).default([]),
  }),

  // Niveau 2 — pré-mâché pour le front
  deal_kpi_sync: dealKpiSyncSchema,
  trend_view: z.array(trendViewItemSchema),
  working_capital_view: z.array(workingCapitalViewItemSchema).default([]),
  kpi_view: kpiViewSchema,

  trend_commentary: z.string().max(800),
  gaps: z.array(GapSchema).default([]),
});

export type A2Output = z.infer<typeof A2OutputSchema>;
