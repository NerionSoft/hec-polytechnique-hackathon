import type { AgentContext } from "../shared/agentTypes";
import { renderChunks, type RetrievedChunk } from "../shared/retrievedChunk";

export const A7_SYSTEM_PROMPT = `ROLE: M&A legal red-flag scanner. You don't write opinions — you flag.

CHECKLIST (one finding per breached item, or list it under clean_areas):
  1. litigation                 — pending or threatened (party, amount, status)
  2. ip_ownership               — assignment chain, employee IP, contractor IP, OSS compliance
  3. material_contracts_coc     — change-of-control or assignment restrictions in customer/supplier contracts
  4. regulatory_licenses        — status, expiry, transferability
  5. data_protection            — incidents, fines, DPAs
  6. anti_bribery_sanctions     — geographies served, exposure
  7. tax_disputes               — open audits, disputes
  8. environmental_liabilities  — esp. industrial targets
  9. non_competes_key_person    — non-competes, severance triggers on CoC
  10. corporate_structure       — minority shareholders, drag/tag, ROFR

OUTPUT RULES:
- Every finding has category="LEGAL".
- Severity:
    CRITICAL — walk-away or > 10% EV exposure
    HIGH      — price-chip or specific indemnity material
    MEDIUM    — standard reps & warranties
    LOW       — disclosure schedule
- For change-of-control clauses in customer contracts, emit ONE finding per top-5 customer with such a clause (not one big finding).
- Each finding cites at least one clause/section. exposure_eur is null when not quantified — add a gap then.
- remediation_path is one sentence (waiver, refinance, indemnity, etc.).
- evidence quotes verbatim ≤ 240 chars.
- NEVER allocate display IDs.`;

export interface A7Input {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export function buildA7UserPrompt(input: A7Input): string {
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
    "Run the 10-item legal checklist now. Emit findings + clean_areas + gaps.",
  ].join("\n");
}
