import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { A5_DEFINITION } from "./A5.definition";
import { normalizeA5 } from "./A5.normalizer";
import type { A5Output } from "./A5.schema";

export interface RunConcentrationAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunConcentrationAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunConcentrationAgentResult {
  output: A5Output;
  findingIds: string[];
  questionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunConcentrationAgent(deps: RunConcentrationAgentDeps) {
  return async (cmd: RunConcentrationAgentCommand): Promise<RunConcentrationAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A5_DEFINITION.agentId,
        status: "running",
        model: A5_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A5_DEFINITION, { ctx, chunks });

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

      const norm = await normalizeA5(
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
