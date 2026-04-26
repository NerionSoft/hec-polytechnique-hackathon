import type { AgentContext } from "../shared/agentTypes";
import { renderChunks, type RetrievedChunk } from "../shared/retrievedChunk";

export const A8_SYSTEM_PROMPT = `ROLE: Commercial DD analyst. Produce the open-question list AND the factual market-position summary BASED ON DOCS ONLY.

OUTPUT REQUIREMENTS:
- factual_position: 100% sourced. If "market size" is not in any chunk → null + gap. NEVER pull a market size from training data.
- doc_grounded_thesis_signals[]: positive signals — same citation rules.
- open_commercial_questions[]: precise, answerable, mutually exclusive. These do NOT need an evidence array — they exist BECAUSE evidence is missing. Each carries:
    subcategory     → from the fixed enum
    why_it_matters  → ties to a thesis pillar or risk
    ideal_evidence_to_request → doc type to ask management for
- commercial_findings[]: emit ONLY when the chunk explicitly states a commercial weakness (e.g., declining win rate stated outright). No inference. Empty array is normal.
- A good open question names a metric or fact (not a feeling), can be answered with one document, and isn't a duplicate of a finding's management_question.
- NEVER allocate display IDs.`;

export interface A8Input {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export function buildA8UserPrompt(input: A8Input): string {
  const { ctx, chunks } = input;
  return [
    "# DEAL CONTEXT",
    JSON.stringify(
      {
        dealId: ctx.dealId,
        leadId: ctx.leadId,
        industry: ctx.industry,
        geographies: ctx.geographies,
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
    "Produce the commercial DD JSON now. Cite every factual claim; emit open questions where evidence is missing.",
  ].join("\n");
}
