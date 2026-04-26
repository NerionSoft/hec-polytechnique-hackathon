import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { A2_DEFINITION } from "./A2.definition";
import { normalizeA2 } from "./A2.normalizer";
import type { A2Output } from "./A2.schema";

export interface RunFinancialAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunFinancialAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunFinancialAgentResult {
  output: A2Output;
  durationMs: number;
  costCents: number | null;
}

export function makeRunFinancialAgent(deps: RunFinancialAgentDeps) {
  return async (cmd: RunFinancialAgentCommand): Promise<RunFinancialAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A2_DEFINITION.agentId,
        status: "running",
        model: A2_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A2_DEFINITION, { ctx, chunks });

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

      await normalizeA2(
        { prisma: deps.prisma },
        { dealId: ctx.dealId, runId: ctx.runId, output: result.output },
      );

      return {
        output: result.output,
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
