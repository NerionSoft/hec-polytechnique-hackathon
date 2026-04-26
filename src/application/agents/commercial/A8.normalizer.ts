import type { PrismaClient } from "@prisma/client";
import { nextDisplayId } from "../shared/displayId";
import { normalizeFindings } from "../shared/findingNormalizer";
import type { A8Output } from "./A8.schema";

export interface NormalizeA8Deps {
  prisma: PrismaClient;
}

export interface NormalizeA8Args {
  dealId: string;
  runId: string;
  output: A8Output;
}

export interface NormalizeA8Result {
  findingIds: string[];
  questionIds: string[];
}

/**
 * Persist A8 output:
 *   - Each open_commercial_question becomes a ManagementQuestion
 *     (no derivedFromFindingId since these arise from MISSING evidence).
 *   - commercial_findings (rare) go through the shared findings normalizer.
 */
export async function normalizeA8(
  deps: NormalizeA8Deps,
  args: NormalizeA8Args,
): Promise<NormalizeA8Result> {
  const questionIds: string[] = [];
  for (const q of args.output.open_commercial_questions) {
    const displayId = await nextDisplayId(deps.prisma, "q", args.dealId);
    const created = await deps.prisma.managementQuestion.create({
      data: {
        displayId,
        dealId: args.dealId,
        runId: args.runId,
        topic: "COMMERCIAL",
        body: q.question,
        derivedFromFindingId: null,
        raisedBy: "ai",
      },
      select: { id: true },
    });
    questionIds.push(created.id);
  }

  const findings = args.output.commercial_findings;
  const findingResult = findings.length
    ? await normalizeFindings(deps, {
        agentId: "A8",
        dealId: args.dealId,
        runId: args.runId,
        findings,
        forceCategory: "COMMERCIAL",
      })
    : { findingIds: [], questionIds: [] };

  return {
    findingIds: findingResult.findingIds,
    questionIds: [...questionIds, ...findingResult.questionIds],
  };
}
