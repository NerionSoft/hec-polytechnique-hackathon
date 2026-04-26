import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { A4_DEFINITION } from "./A4.definition";
import { normalizeA4 } from "./A4.normalizer";
import type { A4Output } from "./A4.schema";

export interface RunEbitdaAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunEbitdaAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunEbitdaAgentResult {
  output: A4Output;
  findingIds: string[];
  questionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunEbitdaAgent(deps: RunEbitdaAgentDeps) {
  return async (cmd: RunEbitdaAgentCommand): Promise<RunEbitdaAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A4_DEFINITION.agentId,
        status: "running",
        model: A4_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A4_DEFINITION, { ctx, chunks });

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

      const norm = await normalizeA4(
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
