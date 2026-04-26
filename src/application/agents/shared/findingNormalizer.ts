import type { PrismaClient } from "@prisma/client";
import type { AgentId } from "./agentTypes";
import { nextDisplayId } from "./displayId";
import { upsertCitationFromEvidence } from "./upsertCitation";
import type { Confidence, FindingCategory, SharedFinding, Severity } from "./findingShape";

export interface NormalizeFindingsDeps {
  prisma: PrismaClient;
}

export interface NormalizeFindingsArgs {
  agentId: AgentId;
  dealId: string;
  runId: string;
  findings: SharedFinding[];
  /**
   * Optional remap of the agent's reported category. Useful when an agent
   * doesn't carry the category in its schema (e.g. "A6 only emits FINANCIAL")
   * and we want to enforce it deterministically.
   */
  forceCategory?: FindingCategory;
  /**
   * Pick the topic of the derived ManagementQuestion. Defaults to the
   * resolved category but can be overridden (e.g. A9 routes ESG findings
   * to OPERATIONAL questions).
   */
  topicFor?: (f: SharedFinding) => FindingCategory;
}

export interface NormalizeFindingsResult {
  findingIds: string[];
  questionIds: string[];
  citationIds: string[];
}

/**
 * Generic findings normalizer used by A3 / A6 / A7 / A9.
 *
 * Steps for each finding:
 *   1. Upsert one Citation per evidence item (dedup on chunkId+quote).
 *   2. Allocate a "rfN" displayId.
 *   3. Insert Finding linked to the primary Citation + many-to-many Citations.
 *   4. If a management_question is present, insert ManagementQuestion with
 *      a "qN" displayId, derivedFromFindingId pointing back to the Finding.
 *
 * Idempotent enough for replays: a re-run on the same JSONB output produces
 * a new run of findings (we don't dedup on externalId across runs by design,
 * to preserve audit history of every pipeline execution).
 */
export async function normalizeFindings(
  deps: NormalizeFindingsDeps,
  args: NormalizeFindingsArgs,
): Promise<NormalizeFindingsResult> {
  const findingIds: string[] = [];
  const questionIds: string[] = [];
  const citationIds: string[] = [];

  for (const f of args.findings) {
    const evidenceItems = f.evidence;
    const perFindingCitationIds: string[] = [];
    for (const ev of evidenceItems) {
      const citationId = await upsertCitationFromEvidence(deps, {
        dealId: args.dealId,
        evidence: ev,
        confidence: confidenceForCitation(f.confidence),
      });
      perFindingCitationIds.push(citationId);
      citationIds.push(citationId);
    }
    const primaryIdx = clampPrimaryIdx(f.primary_evidence_index ?? 0, perFindingCitationIds.length);
    const primaryCitationId = perFindingCitationIds[primaryIdx];

    const findingDisplayId = await nextDisplayId(deps.prisma, "rf", args.dealId);

    const category: FindingCategory = args.forceCategory ?? f.category;

    const finding = await deps.prisma.finding.create({
      data: {
        displayId: findingDisplayId,
        dealId: args.dealId,
        runId: args.runId,
        agentId: args.agentId,
        externalId: f.external_id,
        severity: f.severity as Severity,
        category,
        title: f.title,
        summary: f.summary ?? null,
        detail: f.detail ?? null,
        confidence: f.confidence as Confidence,
        impact: f.impact ?? null,
        suggestedQuestion: f.management_question ?? null,
        exposureEur: f.exposure_eur ?? null,
        primaryCitationId,
        raisedBy: "ai",
        citations: {
          connect: perFindingCitationIds.map((id) => ({ id })),
        },
      },
    });
    findingIds.push(finding.id);

    if (f.management_question) {
      const qDisplayId = await nextDisplayId(deps.prisma, "q", args.dealId);
      const topic = (args.topicFor ?? (() => category))(f);
      const q = await deps.prisma.managementQuestion.create({
        data: {
          displayId: qDisplayId,
          dealId: args.dealId,
          runId: args.runId,
          topic,
          body: f.management_question,
          derivedFromFindingId: finding.id,
          raisedBy: "ai",
        },
      });
      questionIds.push(q.id);
    }
  }

  return { findingIds, questionIds, citationIds };
}

function clampPrimaryIdx(idx: number, len: number): number {
  if (len === 0) return 0;
  if (idx < 0 || idx >= len) return 0;
  return idx;
}

/**
 * Map a Finding's confidence onto its Citation's confidence. They're not
 * the same axis (citation ≈ source quality, finding ≈ analytical certainty)
 * but the source can never be MORE confident than the underlying quote, so
 * we cap.
 */
function confidenceForCitation(findingConfidence: Confidence): Confidence {
  return findingConfidence;
}
