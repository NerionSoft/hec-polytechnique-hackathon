import { z } from "zod";
import { EvidenceSchema, GapSchema } from "../shared/evidence";

export const A4_SCHEMA_VERSION = "v1";

const ADJUSTMENT_CATEGORIES = [
  "owner_comp",
  "non_recurring_legal",
  "covid_related",
  "one_off_project",
  "related_party",
  "rent_normalization",
  "stock_comp",
  "restructuring",
  "other",
] as const;

const adjustmentSchema = z.object({
  external_id: z.string(),
  label: z.string().max(120),
  category: z.enum(ADJUSTMENT_CATEGORIES),
  direction: z.enum(["add_back", "deduction"]),
  amount_eur: z.number().nullable(),
  is_quantified_in_source: z.boolean(),
  rationale: z.string().max(300),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  evidence: z.array(EvidenceSchema).min(1),
  management_question: z.string().max(300).nullable().optional(),
  is_aggressive: z.boolean(),
  bridge_view_type: z.enum(["addition", "warning"]),
});

const bridgeViewItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  type: z.enum(["base", "addition", "warning", "total"]),
  note: z.string().max(160).nullable().optional(),
});

export const A4OutputSchema = z.object({
  currency: z.enum(["EUR", "USD", "GBP"]),
  reported_ebitda: z.object({
    period: z.string(),
    value_eur: z.number(),
    evidence: z.array(EvidenceSchema).min(1),
  }),
  adjustments: z.array(adjustmentSchema),
  adjusted_ebitda_eur: z.number().nullable(),
  adjusted_ebitda_margin: z.number().nullable(),
  bridge_view: z.array(bridgeViewItemSchema),
  gaps: z.array(GapSchema).default([]),
});

export type A4Output = z.infer<typeof A4OutputSchema>;
export type A4Adjustment = z.infer<typeof adjustmentSchema>;
