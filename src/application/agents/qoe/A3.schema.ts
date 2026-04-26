import { z } from "zod";
import { GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A3_SCHEMA_VERSION = "v1";

const QOE_CHECKLIST_ITEMS = [
  "revenue_recognition",
  "ar_aging",
  "customer_concentration_overlap",
  "channel_stuffing",
  "capitalized_costs",
  "working_capital_trends",
  "non_recurring_in_ebitda",
  "related_party",
  "auditor_changes_or_restatements",
  "forecast_aggressiveness",
] as const;

const A3FindingSchema = SharedFindingSchema.extend({
  checklist_item: z.enum(QOE_CHECKLIST_ITEMS),
  category: z.literal("FINANCIAL"),
  metric_observed: z.string().max(400).nullable().optional(),
  potential_impact_on_ebitda_eur: z.number().nullable().optional(),
  false_positive_check: z.string().max(300).nullable().optional(),
  cross_ref: z
    .object({
      agent: z.enum(["A2", "A4", "A5", "A6", "A7", "A8", "A9"]),
      purpose: z.string().max(160),
    })
    .optional(),
});

export const A3OutputSchema = z.object({
  findings: z.array(A3FindingSchema),
  clean_areas: z.array(z.enum(QOE_CHECKLIST_ITEMS)).default([]),
  gaps: z.array(GapSchema).default([]),
});

export type A3Output = z.infer<typeof A3OutputSchema>;
export type A3ChecklistItem = (typeof QOE_CHECKLIST_ITEMS)[number];
