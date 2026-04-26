import { z } from "zod";
import { EvidenceSchema } from "./evidence";

/**
 * Common shape every findings-emitting agent (A3/A6/A7/A9) produces per item.
 * Centralising this prevents drift between agents and lets a single
 * normalizer handle them.
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
  title: z.string().max(120),
  summary: z.string().max(220).nullable().optional(),
  detail: z.string().max(800).nullable().optional(),
  confidence: ConfidenceEnum,
  impact: z.string().max(400).nullable().optional(),
  primary_evidence_index: z.number().int().min(0).default(0),
  evidence: z.array(EvidenceSchema).min(1),
  management_question: z.string().max(400).nullable().optional(),
  exposure_eur: z.number().nullable().optional(),
  deal_impact: DealImpactEnum.optional(),
});

export type SharedFinding = z.infer<typeof SharedFindingSchema>;
export type Severity = z.infer<typeof SeverityEnum>;
export type Confidence = z.infer<typeof ConfidenceEnum>;
export type FindingCategory = z.infer<typeof FindingCategoryEnum>;
