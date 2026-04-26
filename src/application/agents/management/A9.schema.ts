import { z } from "zod";
import { EvidenceSchema, GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A9_SCHEMA_VERSION = "v1";

const A9FindingSchema = SharedFindingSchema.extend({
  category: z.enum(["OPERATIONAL", "ESG"]),
  trigger: z.enum([
    "single_point_of_failure_management",
    "mass_executive_acceleration_on_coc",
    "material_related_party_exposure",
    "weak_governance_structure",
    "recent_management_turnover",
    "no_succession_plan",
  ]),
});

export const A9OutputSchema = z.object({
  key_persons: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        tenure_years: z.number().nullable(),
        comp_total_eur: z.number().nullable(),
        equity_pct: z.number().nullable(),
        non_compete_months: z.number().int().nullable(),
        change_of_control_trigger: z.boolean().nullable(),
        severance_terms: z.string().nullable(),
        evidence: z.array(EvidenceSchema).min(1),
      }),
    )
    .default([]),
  board_composition: z.object({
    size: z.number().int().nullable(),
    independent_directors_count: z.number().int().nullable(),
    committees: z.array(z.string()).default([]),
    evidence: z.array(EvidenceSchema).max(4),
  }),
  related_party_transactions: z
    .array(
      z.object({
        counterparty: z.string(),
        amount_eur: z.number().nullable(),
        nature: z.string(),
        evidence: z.array(EvidenceSchema).min(1),
      }),
    )
    .default([]),
  headcount_total: z.number().int().nullable(),
  redflag_findings: z.array(A9FindingSchema).default([]),
  gaps: z.array(GapSchema).default([]),
});

export type A9Output = z.infer<typeof A9OutputSchema>;
