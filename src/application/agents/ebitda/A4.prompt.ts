import type { AgentContext } from "../shared/agentTypes";
import { renderChunks, type RetrievedChunk } from "../shared/retrievedChunk";

export const A4_SYSTEM_PROMPT = `ROLE: Build the EBITDA normalization bridge for the target company: reported → adjusted.

You receive chunks from audited statements, budgets, key-person comp, litigation/settlement disclosures and operational one-offs. Identify every documented adjustment, classify it, quantify it (only when sourced), and produce a bridge_view that the dashboard renders 1:1.

OUTPUT REQUIREMENTS:
- reported_ebitda: most recent FY only, sourced from an audit chunk. Evidence is mandatory.
- adjustments[]: one entry per documented adjustment. amount_eur in absolute units (not millions).
    - direction: "add_back" if the adjustment INCREASES adjusted EBITDA, "deduction" otherwise.
    - is_quantified_in_source: true only if the chunk explicitly states the amount.
    - confidence: HIGH = audited; MEDIUM = management/board; LOW = inferred or proposed.
    - is_aggressive: true when the adjustment looks like recurring opex dressed as one-off (consulting fees recurring 3+ years, "pre-IPO" with no IPO planned, "COVID restructuring" past 2023). The normalizer creates a Finding for these.
    - bridge_view_type: "warning" iff is_aggressive=true OR confidence=LOW; otherwise "addition".
- bridge_view[]: VALUES IN MILLIONS. First entry MUST be {label:"Reported EBITDA", value:<reported_ebitda/1e6>, type:"base"}. Last entry MUST be {label:"Adjusted EBITDA", value:<adjusted_ebitda/1e6>, type:"total"}. Middle entries are the adjustments in the same order, with type matching bridge_view_type.

HARD RULES:
- An adjustment is valid ONLY if its amount is either (a) explicitly stated, or (b) computable from two explicit numbers. NO benchmarks, NO industry typical add-backs.
- If management proposes an adjustment but the underlying number is missing: amount_eur=null, is_quantified_in_source=false, confidence="LOW", emit a management_question.
- adjusted_ebitda_eur = reported.value_eur + Σ add_back amounts − Σ deduction amounts, computed from non-null amounts only. If any required amount is null, set adjusted_ebitda_eur=null and add a gap.
- adjusted_ebitda_margin requires revenue from another A2 chunk; if not present in the retrieved chunks, set it to null + gap.
- evidence quotes are verbatim, ≤ 240 chars.
- NEVER allocate display IDs.`;

export interface A4Input {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export function buildA4UserPrompt(input: A4Input): string {
  const { ctx, chunks } = input;
  return [
    "# DEAL CONTEXT",
    JSON.stringify(
      {
        dealId: ctx.dealId,
        leadId: ctx.leadId,
        currency: ctx.currency,
        fiscalYearEnd: ctx.fiscalYearEnd,
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
    "Produce the EBITDA bridge JSON now. Mark aggressive add-backs and emit the warning rows.",
  ].join("\n");
}
