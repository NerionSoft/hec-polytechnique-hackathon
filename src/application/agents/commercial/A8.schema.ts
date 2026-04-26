import { z } from "zod";
import { EvidenceSchema, GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A8_SCHEMA_VERSION = "v2";

const QUESTION_SUBCATEGORIES = [
  "market_size",
  "win_rate",
  "churn",
  "unit_economics",
  "competitive_pressure",
  "pricing_power",
  "go_to_market",
  "regulatory_tailwind",
  "product_roadmap",
] as const;

export const A8OutputSchema = z.object({
  factual_position: z.object({
    stated_market: z.string().nullable(),
    stated_market_size_eur: z.number().nullable(),
    stated_growth_rate_pct: z.number().nullable(),
    stated_competitors: z.array(z.string()),
    stated_differentiators: z.array(z.string()),
    evidence: z.array(EvidenceSchema),
  }),
  doc_grounded_thesis_signals: z.array(
    z.object({
      signal: z.string(),
      evidence: z.array(EvidenceSchema),
    }),
  ),
  open_commercial_questions: z.array(
    z.object({
      external_id: z.string(),
      question: z.string(),
      why_it_matters: z.string().nullable(),
      subcategory: z.enum(QUESTION_SUBCATEGORIES),
      ideal_evidence_to_request: z.string().nullable(),
      linked_redflag_external_id: z.string().nullable(),
    }),
  ),
  commercial_findings: z.array(SharedFindingSchema),
  gaps: z.array(GapSchema),
});

export type A8Output = z.infer<typeof A8OutputSchema>;
