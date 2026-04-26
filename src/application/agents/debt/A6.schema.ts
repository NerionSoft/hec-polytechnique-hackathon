import { z } from "zod";
import { EvidenceSchema, GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A6_SCHEMA_VERSION = "v2";

const facilitySchema = z.object({
  external_id: z.string(),
  lender: z.string(),
  instrument_type: z.enum([
    "term_loan_a",
    "term_loan_b",
    "revolver",
    "mezzanine",
    "convertible",
    "shareholder_loan",
    "other",
  ]),
  principal_outstanding_eur: z.number(),
  commitment_eur: z.number().nullable(),
  drawn_pct: z.number().nullable(),
  interest_rate: z.string(),
  maturity_date: z.string().nullable(),
  amortization: z.string().nullable(),
  security: z.string().nullable(),
  guarantors: z.array(z.string()),
  evidence: z.array(EvidenceSchema),
});

const covenantSchema = z.object({
  facility_external_id: z.string(),
  covenant_name: z.string(),
  test_frequency: z.enum(["quarterly", "annual"]).nullable(),
  covenant_level: z.string(),
  covenant_threshold_value: z.number().nullable(),
  current_value: z.number().nullable(),
  headroom_pct: z.number().nullable(),
  next_test_date: z.string().nullable(),
  evidence: z.array(EvidenceSchema),
});

const A6FindingSchema = SharedFindingSchema.extend({
  trigger: z.enum([
    "tight_covenant_headroom",
    "imminent_covenant_breach",
    "near_term_refi_risk",
    "coc_prepayment_trigger",
    "high_leverage_signal",
    "material_off_balance_sheet",
    "covenant_breached_recently",
  ]),
});

export const A6OutputSchema = z.object({
  currency: z.enum(["EUR", "USD", "GBP"]),
  facilities: z.array(facilitySchema),
  covenants: z.array(covenantSchema),
  change_of_control_provisions: z.array(
    z.object({
      facility_external_id: z.string(),
      mechanic: z.enum(["mandatory_prepayment", "consent", "step_up_rate", "none"]),
      evidence: z.array(EvidenceSchema),
    }),
  ),
  off_balance_sheet: z.array(
    z.object({
      type: z.enum(["operating_lease", "guarantee", "factoring", "contingent"]),
      amount_eur: z.number().nullable(),
      counterparty: z.string(),
      evidence: z.array(EvidenceSchema),
    }),
  ),
  computed_ratios: z.object({
    net_debt_eur: z.number().nullable(),
    net_debt_ebitda: z.number().nullable(),
    evidence: z.array(EvidenceSchema),
  }),
  redflag_findings: z.array(A6FindingSchema),
  gaps: z.array(GapSchema),
});

export type A6Output = z.infer<typeof A6OutputSchema>;
