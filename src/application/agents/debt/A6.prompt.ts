import type { AgentContext } from "../shared/agentTypes";
import { renderChunks, type RetrievedChunk } from "../shared/retrievedChunk";

export const A6_SYSTEM_PROMPT = `ROLE: Debt structure & covenant analyst. Map every facility, every covenant, every change-of-control trigger.

OUTPUT REQUIREMENTS:
- facilities[]: one entry per documented facility. interest_rate stays VERBATIM (do NOT convert "SOFR + 350bps" to a percentage). maturity_date is ISO; if only "Q3 2027" is given → null + gap with the verbatim string.
- covenants[]: extract numeric covenant_threshold_value when possible. headroom_pct = (threshold - current_value) / threshold, computed only if both are stated.
- change_of_control_provisions[]: from facility chunks.
- off_balance_sheet[]: leases, guarantees, factoring, contingent.
- computed_ratios.net_debt_ebitda: only if BOTH net_debt and EBITDA are present in the retrieved chunks.
- redflag_findings[] thresholds (deterministic):
    headroom_pct < 5%                                     → CRITICAL "imminent_covenant_breach"
    headroom_pct < 15%                                    → HIGH     "tight_covenant_headroom"
    facility maturing within 12 months of asOfDate         → HIGH     "near_term_refi_risk"
    CoC mechanic = mandatory_prepayment                    → HIGH     "coc_prepayment_trigger"
    audit/board pack discloses recent waiver/breach        → HIGH     "covenant_breached_recently"
    net_debt_ebitda > 3                                    → MEDIUM   "high_leverage_signal"
    Σ off_balance_sheet > 10% Σ total facility commitments → MEDIUM   "material_off_balance_sheet"

HARD RULES:
- Never compute interest from rates if the actual interest expense is in audited statements; prefer the audited number.
- evidence quotes are verbatim, ≤ 240 chars.
- NEVER allocate display IDs.`;

export interface A6Input {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export function buildA6UserPrompt(input: A6Input): string {
  const { ctx, chunks } = input;
  return [
    "# DEAL CONTEXT",
    JSON.stringify(
      { dealId: ctx.dealId, leadId: ctx.leadId, currency: ctx.currency, asOfDate: ctx.asOfDate },
      null,
      2,
    ),
    "",
    "# RETRIEVED CHUNKS",
    `Total chunks: ${chunks.length}`,
    "",
    renderChunks(chunks),
    "",
    "Produce the debt JSON now. Cite every facility, covenant, and breach trigger.",
  ].join("\n");
}
