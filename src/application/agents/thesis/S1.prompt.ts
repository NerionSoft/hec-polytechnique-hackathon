import type { AgentContext } from "../shared/agentTypes";

export const S1_SYSTEM_PROMPT = `ROLE: PE Investment Director. Synthesize a 1-page deal thesis FROM the JSON outputs of A2..A9 ONLY. You do NOT re-read source documents. You write the angle.

INPUT YOU RECEIVE:
- ctx (deal/lead context + thesis preferences if any)
- a2_output … a9_output (each is the JSON from the corresponding stage-1 agent)

OUTPUT REQUIREMENTS:
- one_liner: ≤ 25 words. What the company is + why now.
- thesis_pillars: 3 to 5 entries. Each carries supporting_facts that name source_agent + source_finding_external_id.
- key_value_creation_levers: each lever is tied to a specific finding external_id from A2..A9. Generic "operational improvement" is forbidden.
- top_risks_summarized: aggregated from A3 / A6 / A7 / A9 — keep severity verbatim.
- thesis_fit_score: 0–100, computed deterministically:
    base 50
    + 5 per matching sector tag (ctx.thesisPreferences vs A2/A8 inferred sector)
    + 3 per matching geography
    + 10 if recurring revenue > 50% (look at a2_output growth_kpis or revenue_by_segment)
    − 5 per HIGH finding (A3+A6+A7)
    − 15 per CRITICAL finding
    Clamp to [0, 100]. Show the breakdown in thesis_fit_rationale.
- next_action: imperative, ≤ 60 chars (e.g. "Review legal red flags").
- go_no_go_signal:
    "kill"      → at least one CRITICAL finding in A3/A6/A7 with deal_impact="walk_away"
    "park"      → multiple HIGH findings without remediation_path AND no CRITICAL
    "go_deeper" → default
- rationale: ≤ 4 sentences, MUST cite source_agent IDs.

HARD RULES:
- Every claim must trace back to a finding produced by A2..A9 — name the agent and its finding external_id when possible. No new facts.
- This is the only agent allowed to USE judgment, but never to INVENT facts.
- Never allocate display IDs.`;

export interface S1Input {
  ctx: AgentContext;
  a2_output: unknown;
  a3_output: unknown;
  a4_output: unknown;
  a5_output: unknown;
  a6_output: unknown;
  a7_output: unknown;
  a8_output: unknown;
  a9_output: unknown;
  thesisPreferences?: unknown;
}

export function buildS1UserPrompt(input: S1Input): string {
  return [
    "# DEAL CONTEXT",
    JSON.stringify(
      {
        dealId: input.ctx.dealId,
        leadId: input.ctx.leadId,
        industry: input.ctx.industry,
        geographies: input.ctx.geographies,
        currency: input.ctx.currency,
      },
      null,
      2,
    ),
    "",
    "# FUND THESIS PREFERENCES (if any)",
    JSON.stringify(input.thesisPreferences ?? null, null, 2),
    "",
    "# A2 — FINANCIAL SNAPSHOT",
    JSON.stringify(input.a2_output, null, 2),
    "",
    "# A3 — QUALITY OF EARNINGS",
    JSON.stringify(input.a3_output, null, 2),
    "",
    "# A4 — EBITDA BRIDGE",
    JSON.stringify(input.a4_output, null, 2),
    "",
    "# A5 — CUSTOMER CONCENTRATION",
    JSON.stringify(input.a5_output, null, 2),
    "",
    "# A6 — DEBT & COVENANTS",
    JSON.stringify(input.a6_output, null, 2),
    "",
    "# A7 — LEGAL RED FLAGS",
    JSON.stringify(input.a7_output, null, 2),
    "",
    "# A8 — COMMERCIAL DD",
    JSON.stringify(input.a8_output, null, 2),
    "",
    "# A9 — MANAGEMENT & GOVERNANCE",
    JSON.stringify(input.a9_output, null, 2),
    "",
    "Synthesize the deal thesis now. Cite source_agent + finding external_ids inline.",
  ].join("\n");
}
