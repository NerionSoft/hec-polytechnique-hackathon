import { z } from "zod";
import { EvidenceSchema, GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A5_SCHEMA_VERSION = "v2";

const concentrationViewItemSchema = z.object({
  name: z.string(),
  share: z.number(),
  flag: z.boolean(),
  evidence: z.array(EvidenceSchema),
});

const retentionViewSchema = z.object({
  period: z.string(),
  nrr: z.number().nullable(),
  grr: z.number().nullable(),
  churn: z.number().nullable(),
  evidence: z.array(EvidenceSchema),
});

const contractSchema = z.object({
  client_id_or_name: z.string(),
  industry: z.string().nullable(),
  annual_value_eur: z.number(),
  term_start: z.string().nullable(),
  term_end: z.string().nullable(),
  remaining_months: z.number().int().nullable(),
  auto_renewal: z.boolean().nullable(),
  termination_for_convenience_days: z.number().int().nullable(),
  change_of_control_clause: z.enum(["consent_required", "notice_only", "none", "unknown"]),
  exclusivity: z.boolean().nullable(),
  mfn_clause: z.boolean().nullable(),
  sla_penalties_pct_revenue: z.number().nullable(),
  evidence: z.array(EvidenceSchema),
});

const A5FindingSchema = SharedFindingSchema.extend({
  trigger: z.enum([
    "top1_>20pct",
    "top3_>40pct",
    "top10_>60pct",
    "coc_consent_top5",
    "near_term_expiry_top5",
    "unilateral_termination_top5",
  ]),
});

export const A5OutputSchema = z.object({
  as_of_date: z.string(),
  currency: z.enum(["EUR", "USD", "GBP"]),
  total_revenue_eur: z.number().nullable(),
  concentration: z.object({
    top_1_pct: z.number().nullable(),
    top_3_pct: z.number().nullable(),
    top_5_pct: z.number().nullable(),
    top_10_pct: z.number().nullable(),
    evidence: z.array(EvidenceSchema),
  }),
  tier_breakdown: z.array(
    z.object({
      tier: z.string(),
      threshold_eur: z.number(),
      client_count: z.number().int(),
      total_eur: z.number(),
      share_of_revenue_pct: z.number(),
      evidence: z.array(EvidenceSchema),
    }),
  ),
  contracts: z.array(contractSchema),
  churn_signals: z.array(
    z.object({
      client: z.string(),
      signal: z.enum(["non-renewal notice", "scope reduction", "litigation", "price concession"]),
      evidence: z.array(EvidenceSchema),
    }),
  ),
  concentration_view: z.array(concentrationViewItemSchema),
  retention_view: retentionViewSchema,
  redflag_findings: z.array(A5FindingSchema),
  gaps: z.array(GapSchema),
});

export type A5Output = z.infer<typeof A5OutputSchema>;
