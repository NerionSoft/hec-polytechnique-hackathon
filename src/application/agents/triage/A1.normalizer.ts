import type { PrismaClient, DocCategory } from "@prisma/client";
import type { A1Output, A1FrontCategory, A1PeTaxonomy } from "./A1.schema";

/**
 * Maps the fine-grained pe_taxonomy to the dashboard's coarse DocCategory enum.
 * Only used as a fallback when the agent's `front_category` is missing or
 * disagrees obviously with the taxonomy (extra defense in depth).
 */
const TAXONOMY_TO_FRONT: Record<A1PeTaxonomy, A1FrontCategory> = {
  "financial.audit": "FINANCIAL",
  "financial.budget": "FINANCIAL",
  "financial.ar_aging": "FINANCIAL",
  tax: "TAX",
  "customer.contract.tier1": "LEGAL",
  "customer.contract.tier2": "LEGAL",
  "debt.facility": "LEGAL",
  "debt.covenant": "LEGAL",
  "legal.litigation": "LEGAL",
  "legal.ip": "LEGAL",
  "legal.change_of_control": "LEGAL",
  "regulatory.compliance": "LEGAL",
  "governance.board": "LEGAL",
  "hr.key_person": "HR",
  "hr.policy": "HR",
  "commercial.market_study": "COMMERCIAL",
  "operations.kpi": "COMMERCIAL",
  "operations.security": "COMMERCIAL",
  other: "LEGAL",
};

export interface NormalizeA1Deps {
  prisma: Pick<PrismaClient, "document">;
}

/**
 * Persist the A1 triage result onto the Document row.
 *
 * Idempotent: re-running the same A1 output yields the same Document state.
 * Status flips to FAILED only when the agent explicitly reports an
 * extraction gap; everything else flips to INDEXED.
 */
export async function normalizeA1(deps: NormalizeA1Deps, output: A1Output): Promise<void> {
  const isExtractionFailure = output.gap?.field === "extraction";
  const category: DocCategory =
    output.front_category ?? TAXONOMY_TO_FRONT[output.pe_taxonomy[0] ?? "other"];

  await deps.prisma.document.update({
    where: { id: output.doc_id },
    data: {
      category,
      peTaxonomy: output.pe_taxonomy,
      dealRelevance: output.deal_relevance,
      riskSignal: output.risk_signal,
      routedTo: output.route_to_agents,
      redflagKeywords: output.redflag_keywords_hit ?? [],
      status: isExtractionFailure ? "FAILED" : "INDEXED",
    },
  });
}
