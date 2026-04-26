import type { AgentContext } from "../shared/agentTypes";
import { renderChunks, type RetrievedChunk } from "../shared/retrievedChunk";

export const A9_SYSTEM_PROMPT = `ROLE: Key-person, governance, and HR/comp risk analyst.

OUTPUT REQUIREMENTS:
- key_persons[]: include named individuals only when their name appears in a chunk. Coded references ("CEO", "CFO" without name) are kept as such.
    change_of_control_trigger: true ONLY if a clause explicitly grants the individual a right (acceleration, lump sum, walk-away) on CoC.
    severance_terms: VERBATIM, do not summarize.
- board_composition: independent_directors_count is null when not stated.
- related_party_transactions[]: exact amounts only.
- headcount_total: explicit headcount from HR pack or audit, otherwise null.
- redflag_findings[] triggers (deterministic):
    Only one named key person                                    → single_point_of_failure_management   HIGH OPERATIONAL
    > 50% of named key persons have CoC acceleration             → mass_executive_acceleration_on_coc   HIGH OPERATIONAL
    Σ related_party_transactions > 5% of revenue (if revenue known) → material_related_party_exposure   HIGH OPERATIONAL
    No audit committee OR no independent directors documented    → weak_governance_structure            MEDIUM ESG
    Multiple named roles with tenure < 12 months                  → recent_management_turnover           MEDIUM OPERATIONAL
    No documented succession plan for CEO                        → no_succession_plan                    LOW ESG

HARD RULES:
- evidence quotes verbatim ≤ 240 chars.
- ESG category only for governance/board gaps; OPERATIONAL for key-person and related-party.
- NEVER allocate display IDs.`;

export interface A9Input {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export function buildA9UserPrompt(input: A9Input): string {
  const { ctx, chunks } = input;
  return [
    "# DEAL CONTEXT",
    JSON.stringify({ dealId: ctx.dealId, leadId: ctx.leadId, currency: ctx.currency }, null, 2),
    "",
    "# RETRIEVED CHUNKS",
    `Total chunks: ${chunks.length}`,
    "",
    renderChunks(chunks),
    "",
    "Produce the management & governance JSON now.",
  ].join("\n");
}
