import { z } from "zod";
import { GapSchema } from "../shared/evidence";
import { SharedFindingSchema } from "../shared/findingShape";

export const A7_SCHEMA_VERSION = "v2";

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
  checklist_item: z.enum(LEGAL_CHECKLIST_ITEMS),
  remediation_path: z.string().nullable(),
});

export const A7OutputSchema = z.object({
  findings: z.array(A7FindingSchema),
  clean_areas: z.array(z.enum(LEGAL_CHECKLIST_ITEMS)),
  gaps: z.array(GapSchema),
});

export type A7Output = z.infer<typeof A7OutputSchema>;
