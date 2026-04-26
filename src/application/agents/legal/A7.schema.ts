import { z } from "zod";
import { GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A7_SCHEMA_VERSION = "v1";

const LEGAL_CHECKLIST_ITEMS = [
  "litigation",
  "ip_ownership",
  "material_contracts_coc",
  "regulatory_licenses",
  "data_protection",
  "anti_bribery_sanctions",
  "tax_disputes",
  "environmental_liabilities",
  "non_competes_key_person",
  "corporate_structure",
] as const;

const A7FindingSchema = SharedFindingSchema.extend({
  category: z.literal("LEGAL"),
  checklist_item: z.enum(LEGAL_CHECKLIST_ITEMS),
  remediation_path: z.string().max(300).nullable().optional(),
});

export const A7OutputSchema = z.object({
  findings: z.array(A7FindingSchema),
  clean_areas: z.array(z.enum(LEGAL_CHECKLIST_ITEMS)).default([]),
  gaps: z.array(GapSchema).default([]),
});

export type A7Output = z.infer<typeof A7OutputSchema>;
