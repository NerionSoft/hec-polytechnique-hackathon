import { z } from "zod";

export const A1_SCHEMA_VERSION = "v1";

const FRONT_CATEGORY = ["COMMERCIAL", "FINANCIAL", "LEGAL", "HR", "TAX"] as const;

const PE_TAXONOMY = [
  "financial.audit",
  "financial.budget",
  "financial.ar_aging",
  "customer.contract.tier1",
  "customer.contract.tier2",
  "debt.facility",
  "debt.covenant",
  "legal.litigation",
  "legal.ip",
  "legal.change_of_control",
  "hr.key_person",
  "hr.policy",
  "regulatory.compliance",
  "tax",
  "governance.board",
  "commercial.market_study",
  "operations.kpi",
  "operations.security",
  "other",
] as const;

const ROUTABLE_AGENTS = ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"] as const;

const evidenceSchema = z.object({
  doc_id: z.string(),
  section: z.string().nullable(),
  page: z.number().int().nullable().optional(),
  quote: z.string().min(1).max(240),
  chunk_id: z.string().nullable(),
});

export const A1OutputSchema = z.object({
  doc_id: z.string().describe("Echo of the Document.id provided in input."),
  front_category: z
    .enum(FRONT_CATEGORY)
    .describe("Top-level taxonomy used by the dashboard /data-room page."),
  pe_taxonomy: z
    .array(z.enum(PE_TAXONOMY))
    .min(1)
    .describe("Fine-grained tags for routing; one document can carry several."),
  deal_relevance: z.number().int().min(1).max(5),
  risk_signal: z.number().int().min(0).max(5),
  redflag_keywords_hit: z.array(z.string()).default([]),
  route_to_agents: z
    .array(z.enum(ROUTABLE_AGENTS))
    .describe("Specialists that must read this document."),
  evidence: z
    .array(evidenceSchema)
    .max(2)
    .describe("Up to 2 quotes justifying the classification."),
  gap: z
    .object({
      field: z.string(),
      reason: z.string(),
      suggested_request: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type A1Output = z.infer<typeof A1OutputSchema>;
export type A1FrontCategory = (typeof FRONT_CATEGORY)[number];
export type A1PeTaxonomy = (typeof PE_TAXONOMY)[number];
