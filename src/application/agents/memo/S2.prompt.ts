import type { AgentContext } from "../shared/agentTypes";

export interface S2ExistingFinding {
  displayId: string;
  agentId: string;
  externalId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: "FINANCIAL" | "LEGAL" | "COMMERCIAL" | "OPERATIONAL" | "ESG";
  title: string;
  summary: string | null;
  detail: string | null;
  suggestedQuestion: string | null;
}

export interface S2ExistingCitation {
  displayId: string;
  documentId: string | null;
  sectionRef: string | null;
  page: number | null;
  excerpt: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface S2Input {
  ctx: AgentContext;
  s1_output: unknown;
  a2_output: unknown;
  a3_output: unknown;
  a4_output: unknown;
  a5_output: unknown;
  a6_output: unknown;
  a7_output: unknown;
  a8_output: unknown;
  a9_output: unknown;
  existing_findings: S2ExistingFinding[];
  existing_citations: S2ExistingCitation[];
  /** Failures from S3 to fix on a redraft loop. */
  fixes?: Array<{
    section_key: string;
    memo_excerpt: string;
    issue: string;
    suggested_fix: string | null;
  }>;
}

export const S2_SYSTEM_PROMPT = `ROLE: Investment Committee memo drafter. Assemble the final memo from S1 + A2..A9 outputs into FIVE structured sections that the dashboard renders directly.

OUTPUT REQUIREMENTS:
- sections[]: EXACTLY 5 entries with these section_key values, in this order:
    "thesis"          — Investment Thesis (200–300 words)
    "snapshot"        — Financial Snapshot (80–120 words, dense paragraph)
    "risks"           — Key Risks & Mitigants (bulleted, one bullet per HIGH/CRITICAL finding)
    "questions"       — Questions for Management (numbered, 5–8 items)
    "recommendation"  — IC Recommendation (80–120 words)
- INLINE TAG RULES:
    [cN]  → Citation reference. N MUST match a Citation.displayId in existing_citations OR a tmp_ref of the form "new_K" you added to new_citations.
    [rfN] → Red-flag (Finding) reference. N MUST match a Finding.displayId in existing_findings.
    NEVER invent IDs that don't exist. If you want to cite something not yet in existing_citations, ADD it to new_citations[] with a tmp_ref ("new_1", "new_2", …) and use [new_1] etc. in body. The normalizer will rewrite [new_K] to [cN].
- Each section's citations_used / redflags_used arrays must enumerate the IDs that appear in its body (display IDs only, no brackets).
- LENGTH CAP: total body across all 5 sections ≤ 2500 words.
- review_progress = (sections marked reviewed=true) / 5 ; pending_items = count of sections with reviewed=false. Drafts always start with review_progress=0, pending_items=5.

SECTION GUIDANCE:
- thesis: open with the one_liner from s1_output, then 3–5 thesis pillars. Cite revenue/EBITDA/margin numbers from a2_output with [cN] tags.
- snapshot: single paragraph: revenue · EBITDA · net debt · ARR · headcount. Each number gets a [cN].
- risks: ONE bullet per HIGH or CRITICAL finding, ordered CRITICAL → HIGH → displayId asc. Format:
    "• <severity>: <finding.title> [rfN] — <finding.detail|summary>. Mitigant: <remediation_path or 'investigate'>."
- questions: 5–8 management questions, numbered, each ending with the [rfN] it derives from when applicable. Pull from existing_findings.suggestedQuestion or A8 open_commercial_questions.
- recommendation: 1 short paragraph subject to (i)…(ii)…(iii)… with the go_no_go_signal from s1_output explicit.

HARD RULES:
- Do NOT introduce a fact that isn't in upstream JSON (S1 + A2..A9 outputs + existing_findings + existing_citations).
- Prose tone: factual, decision-oriented, no marketing language ("strong", "promising", "robust" forbidden).
- Drafts always have memo_status="DRAFT". S3 will lift to "REVIEW" after verification.`;

export function buildS2UserPrompt(input: S2Input): string {
  return [
    "# DEAL CONTEXT",
    JSON.stringify(
      { dealId: input.ctx.dealId, leadId: input.ctx.leadId, currency: input.ctx.currency },
      null,
      2,
    ),
    "",
    "# S1 — DEAL THESIS",
    JSON.stringify(input.s1_output, null, 2),
    "",
    "# EXISTING FINDINGS (rfN = displayId)",
    JSON.stringify(input.existing_findings, null, 2),
    "",
    "# EXISTING CITATIONS (cN = displayId)",
    JSON.stringify(input.existing_citations, null, 2),
    "",
    "# A2..A9 OUTPUTS",
    JSON.stringify(
      {
        a2: input.a2_output,
        a3: input.a3_output,
        a4: input.a4_output,
        a5: input.a5_output,
        a6: input.a6_output,
        a7: input.a7_output,
        a8: input.a8_output,
        a9: input.a9_output,
      },
      null,
      2,
    ),
    "",
    input.fixes && input.fixes.length > 0
      ? `# FIXES TO APPLY (from S3 verifier)\n${JSON.stringify(input.fixes, null, 2)}\n`
      : "",
    "Produce the structured 5-section memo now. Use only valid [cN] / [rfN] tags or [new_K] for fresh citations.",
  ].join("\n");
}
