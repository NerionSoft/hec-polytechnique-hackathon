import { z } from "zod";
import { GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A3_SCHEMA_VERSION = "v2";

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
  metric_observed: z.string().nullable(),
  potential_impact_on_ebitda_eur: z.number().nullable(),
  false_positive_check: z.string().nullable(),
});

export const A3OutputSchema = z.object({
  findings: z.array(A3FindingSchema),
  clean_areas: z.array(z.enum(QOE_CHECKLIST_ITEMS)),
  gaps: z.array(GapSchema),
});

export type A3Output = z.infer<typeof A3OutputSchema>;
export type A3ChecklistItem = (typeof QOE_CHECKLIST_ITEMS)[number];
