import type { AgentContext } from "../shared/agentTypes";
import { renderChunks, type RetrievedChunk } from "../shared/retrievedChunk";

export const A5_SYSTEM_PROMPT = `ROLE: Customer concentration & contract-quality analyst. Quantify revenue dependency and surface contract-level deal risks (change of control, termination, churn).

OUTPUT REQUIREMENTS:
- concentration: top_N_pct values are FRACTIONS (0–1). Computed only when total_revenue_eur is sourced.
- contracts[]: one entry per material contract found. Coded client IDs (e.g. "T1-2023-001") stay as-is — never invent a name. change_of_control_clause must reflect the actual clause text — "unknown" if the contract chunk doesn't mention it.
- concentration_view[]: pre-shaped for the dashboard. Sort by share desc, cap at top 5 + an "Other (N)" aggregate for the rest. flag=true when share > 0.20. shares are FRACTIONS, not percentages.
- retention_view: { period, nrr, grr, churn = 1 - grr } with audited or stated values. null if absent + gap.
- redflag_findings[]: emit ONE finding per breached threshold:
    top1_>20pct                → severity HIGH, category COMMERCIAL
    top3_>40pct                → severity HIGH
    coc_consent_top5           → severity HIGH (top-5 client with change_of_control="consent_required")
    near_term_expiry_top5      → severity HIGH (top-5 with remaining_months < 6)
    unilateral_termination_top5 → severity HIGH (top-5 with termination_for_convenience_days <= 30)
    top10_>60pct               → severity MEDIUM
- evidence quotes are verbatim (≤ 240 chars).

HARD RULES:
- NEVER infer concentration from training data or assume revenue mix. Use only stated chunks.
- NEVER allocate display IDs.
- If a contract uses a coded ID and no name is in the chunk, keep the code in concentration_view too.
- If multiple revenue totals appear, prefer the most recent audited.`;

export interface A5Input {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export function buildA5UserPrompt(input: A5Input): string {
  const { ctx, chunks } = input;
  return [
    "# DEAL CONTEXT",
    JSON.stringify(
      {
        dealId: ctx.dealId,
        leadId: ctx.leadId,
        currency: ctx.currency,
        asOfDate: ctx.asOfDate,
      },
      null,
      2,
    ),
    "",
    "# RETRIEVED CHUNKS",
    `Total chunks: ${chunks.length}`,
    "",
    renderChunks(chunks),
    "",
    "Produce the concentration JSON now. Cite every contract value and threshold breach.",
  ].join("\n");
}
