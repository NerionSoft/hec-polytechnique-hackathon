import { z } from "zod";
import { EvidenceSchema } from "./evidence";

/**
 * Common shape every findings-emitting agent (A3/A6/A7/A9) produces per item.
 *
 * Schema constraints kept Gemini-friendly: no `.max()` on strings, no
 * `.default()`, no `.optional()` chained with `.nullable()`. Plain
 * `.nullable()` everywhere — the model returns `null` when the field is
 * missing.
 */
export const SeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const ConfidenceEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const FindingCategoryEnum = z.enum([
  "FINANCIAL",
  "LEGAL",
  "COMMERCIAL",
  "OPERATIONAL",
  "ESG",
]);
export const DealImpactEnum = z.enum([
  "price_chip",
  "condition_precedent",
  "reps_warranties",
  "indemnity",
  "walk_away",
  "information_only",
]);

export const SharedFindingSchema = z.object({
  external_id: z.string(),
  severity: SeverityEnum,
  category: FindingCategoryEnum,
  title: z.string(),
  summary: z.string().nullable(),
  detail: z.string().nullable(),
  confidence: ConfidenceEnum,
  impact: z.string().nullable(),
  primary_evidence_index: z.number().int(),
  evidence: z.array(EvidenceSchema),
  management_question: z.string().nullable(),
  exposure_eur: z.number().nullable(),
  deal_impact: DealImpactEnum.nullable(),
});

export type SharedFinding = z.infer<typeof SharedFindingSchema>;
export type Severity = z.infer<typeof SeverityEnum>;
export type Confidence = z.infer<typeof ConfidenceEnum>;
export type FindingCategory = z.infer<typeof FindingCategoryEnum>;
