import { z } from "zod";

export const S1_SCHEMA_VERSION = "v1";

const supportingFactSchema = z.object({
  fact: z.string(),
  source_agent: z.enum(["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"]),
  source_finding_external_id: z.string().nullable().optional(),
});

const thesisPillarSchema = z.object({
  pillar: z.string().max(160),
  supporting_facts: z.array(supportingFactSchema).min(1),
});

const valueLeverSchema = z.object({
  lever: z.enum([
    "pricing",
    "cross_sell",
    "geo_expansion",
    "add_on_M&A",
    "margin_optimization",
    "working_capital",
  ]),
  evidence_basis: z.array(
    z.object({
      source_agent: z.enum(["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"]),
      finding_external_id: z.string().nullable().optional(),
    }),
  ),
  tied_to_redflag_or_opportunity: z.string(),
});

const summarizedRiskSchema = z.object({
  risk: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  source_agent: z.enum(["A3", "A6", "A7", "A9"]),
});

export const S1OutputSchema = z.object({
  one_liner: z.string().max(160),
  thesis_pillars: z.array(thesisPillarSchema).min(3).max(5),
  key_value_creation_levers: z.array(valueLeverSchema).max(6),
  top_risks_summarized: z.array(summarizedRiskSchema).max(8),
  thesis_fit_score: z.number().int().min(0).max(100),
  thesis_fit_rationale: z.string().max(400),
  next_action: z.string().max(60),
  go_no_go_signal: z.enum(["go_deeper", "park", "kill"]),
  rationale: z.string().max(600),
});

export type S1Output = z.infer<typeof S1OutputSchema>;
