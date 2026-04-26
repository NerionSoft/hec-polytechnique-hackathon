import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { A8_DEFINITION } from "./A8.definition";
import { normalizeA8 } from "./A8.normalizer";
import type { A8Output } from "./A8.schema";

export interface RunCommercialAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunCommercialAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunCommercialAgentResult {
  output: A8Output;
  findingIds: string[];
  questionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunCommercialAgent(deps: RunCommercialAgentDeps) {
  return async (cmd: RunCommercialAgentCommand): Promise<RunCommercialAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A8_DEFINITION.agentId,
        status: "running",
        model: A8_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A8_DEFINITION, { ctx, chunks });

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

      const norm = await normalizeA8(
        { prisma: deps.prisma },
        { dealId: ctx.dealId, runId: ctx.runId, output: result.output },
      );

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
