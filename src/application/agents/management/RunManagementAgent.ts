import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext, AgentId } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { normalizeFindings } from "../shared/findingNormalizer";
import { A9_DEFINITION } from "./A9.definition";
import type { A9Output } from "./A9.schema";

export interface RunManagementAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunManagementAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunManagementAgentResult {
  output: A9Output;
  findingIds: string[];
  questionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunManagementAgent(deps: RunManagementAgentDeps) {
  return async (cmd: RunManagementAgentCommand): Promise<RunManagementAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();
    const agentId: AgentId = A9_DEFINITION.agentId;

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId,
        status: "running",
        model: A9_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A9_DEFINITION, { ctx, chunks });

      await deps.prisma.agentOutput.update({
        where: { id: ao.id },
        data: {
          status: "success",
          output: result.output as object,
          promptHash: result.promptHash,
          tokensIn: result.usage.promptTokens,
          tokensOut: result.usage.completionTokens,
          costCents: result.usage.costCents,
          durationMs: result.durationMs,
          completedAt: new Date(),
        },
      });

      // Sync Deal.employees only if A2 didn't already (guarded by null check
      // on the existing column).
      if (result.output.headcount_total != null) {
        await deps.prisma.deal
          .update({
            where: { id: ctx.dealId, employees: null },
            data: { employees: result.output.headcount_total },
          })
          .catch(() => undefined); // race-tolerant — A2 may have set it first
      }

      const findings = result.output.redflag_findings;
      const norm = findings.length
        ? await normalizeFindings(
            { prisma: deps.prisma },
            {
              agentId: "A9",
              dealId: ctx.dealId,
              runId: ctx.runId,
              findings,
              // For A9 each finding carries its own category (OPERATIONAL or ESG).
              // ESG findings still produce OPERATIONAL questions per the spec.
              topicFor: () => "OPERATIONAL",
            },
          )
        : { findingIds: [], questionIds: [] };

      return {
        output: result.output,
        findingIds: norm.findingIds,
        questionIds: norm.questionIds,
        durationMs: result.durationMs,
        costCents: result.usage.costCents,
      };
    } catch (err) {
      await deps.prisma.agentOutput.update({
        where: { id: ao.id },
        data: {
          status: "failed",
          errorJson: serializeError(err),
          durationMs: Date.now() - startedAt.getTime(),
          completedAt: new Date(),
        },
      });
      throw err;
    }
  };
}

function serializeError(err: unknown): object {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { error: String(err) };
}
