import type { Prisma, PrismaClient } from "@prisma/client";
import type { S3Output } from "./S3.schema";

export interface NormalizeS3Deps {
  prisma: PrismaClient;
}

export interface NormalizeS3Args {
  dealId: string;
  runId: string;
  output: S3Output;
  /** Loop iteration index (0-based). After 3 fails the memo is flagged for human review. */
  iteration: number;
}

const MAX_ITERATIONS = 3;

/**
 * Persist S3 output:
 *   - Flip Citation.verified=true on all citations referenced and not in failures.
 *   - Update DDRun.citationPassRate.
 *   - On verdict=pass: Memo.status → REVIEW.
 *   - On verdict=fail at iteration ≥ MAX_ITERATIONS-1: Memo.status → NEEDS_REVIEW
 *     and DDRun.status → NEEDS_REVIEW.
 *   - Always emit a DealAuditEvent kind="citation_verifier_run".
 */
export async function normalizeS3(
  deps: NormalizeS3Deps,
  args: NormalizeS3Args,
): Promise<{ shouldRedraft: boolean }> {
  const { dealId, runId, output, iteration } = args;

  const failedDisplayIds = new Set(
    output.failures
      .map((f) => f.claimed_tag.replace(/[\[\]]/g, ""))
      .filter((tag) => tag.startsWith("c")),
  );

  await deps.prisma.citation.updateMany({
    where: {
      dealId,
      verified: false,
      ...(failedDisplayIds.size > 0 ? { displayId: { notIn: Array.from(failedDisplayIds) } } : {}),
    },
    data: { verified: true },
  });

  await deps.prisma.dDRun.update({
    where: { id: runId },
    data: {
      citationPassRate: Number(output.pass_rate.toFixed(4)),
    },
  });

  let shouldRedraft = false;
  if (output.verdict === "pass") {
    await deps.prisma.memo.update({
      where: { dealId },
      data: { status: "REVIEW" },
    });
  } else if (iteration >= MAX_ITERATIONS - 1) {
    await deps.prisma.memo.update({
      where: { dealId },
      data: { status: "NEEDS_REVIEW" },
    });
    await deps.prisma.dDRun.update({
      where: { id: runId },
      data: { status: "NEEDS_REVIEW" },
    });
  } else {
    shouldRedraft = true;
  }

  await deps.prisma.dealAuditEvent.create({
    data: {
      dealId,
      kind: "citation_verifier_run",
      payload: { iteration, output } as unknown as Prisma.InputJsonValue,
    },
  });

  return { shouldRedraft };
}
