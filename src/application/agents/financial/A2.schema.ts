import { z } from "zod";
import { EvidenceSchema, GapSchema } from "../shared/evidence";

export const A2_SCHEMA_VERSION = "v2";

/**
 * Gemini's `responseSchema` (Vercel AI SDK `Output.object`) is a constrained
 * subset of JSON Schema. It rejects:
 *   - `.default()` — defaults are silently dropped or trigger 400
 *   - `.max(n)` / `.min(n)` on arrays — supported but flaky on long enums
 *   - Deeply-optional chains (`.optional().nullable()` etc.)
 *
 * We keep the schema lean and only model what the front and the normalizer
 * actually consume. Audit-grade level-1 metrics (P&L, balance sheet, cash
 * flow) live in `agent_output.output` JSONB if Gemini decides to include
 * them — the schema doesn't enforce them, the prompt asks for them.
 */
const periodMetricSchema = z.object({
  period: z.string(),
  value: z.number().nullable(),
  evidence: z.array(EvidenceSchema),
});

const dealKpiSyncSchema = z.object({
  revenue_eur: z.number().nullable(),
  ebitda_eur: z.number().nullable(),
  ebitda_margin: z.number().nullable(),
  growth_yoy: z.number().nullable(),
  net_debt_ebitda: z.number().nullable(),
  employees: z.number().int().nullable(),
  founded: z.number().int().nullable(),
  evidence: z.array(EvidenceSchema),
});

const trendViewItemSchema = z.object({
  period: z.string(),
  revenue_m: z.number(),
  ebitda_m: z.number().nullable(),
  evidence: z.array(EvidenceSchema),
});

const workingCapitalViewItemSchema = z.object({
  period: z.string(),
  dso: z.number().nullable(),
  dpo: z.number().nullable(),
  dio: z.number().nullable(),
  evidence: z.array(EvidenceSchema),
});

const kpiViewSchema = z.object({
  revenue_m: z.number().nullable(),
  ebitda_m: z.number().nullable(),
  ebitda_margin: z.number().nullable(),
  growth_yoy: z.number().nullable(),
  net_debt_ebitda: z.number().nullable(),
  headcount: z.number().int().nullable(),
  client_count: z.number().int().nullable(),
  evidence: z.array(EvidenceSchema),
});

export const A2OutputSchema = z.object({
  period_covered: z.object({
    from: z.string(),
    to: z.string(),
  }),
  currency: z.enum(["EUR", "USD", "GBP"]),
  deal_kpi_sync: dealKpiSyncSchema,
  trend_view: z.array(trendViewItemSchema),
  working_capital_view: z.array(workingCapitalViewItemSchema),
  kpi_view: kpiViewSchema,
  trend_commentary: z.string(),
  gaps: z.array(GapSchema),
  // Optional level-1 audit data (P&L, balance sheet, cash flow). Reserved
  // for retrieval/replay; not consumed by the dashboard.
  p_and_l_revenue: z.array(periodMetricSchema),
  p_and_l_ebitda: z.array(periodMetricSchema),
});

export type A2Output = z.infer<typeof A2OutputSchema>;
