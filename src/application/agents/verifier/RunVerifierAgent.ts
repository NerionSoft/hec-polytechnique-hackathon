import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import { S3_DEFINITION } from "./S3.definition";
import { normalizeS3 } from "./S3.normalizer";
import type { S3Input } from "./S3.prompt";
import type { S3Output } from "./S3.schema";

export interface RunVerifierAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunVerifierAgentCommand {
  ctx: AgentContext;
  input: Omit<S3Input, "ctx">;
  iteration: number;
}

export interface RunVerifierAgentResult {
  output: S3Output;
  shouldRedraft: boolean;
  durationMs: number;
  costCents: number | null;
}

export function makeRunVerifierAgent(deps: RunVerifierAgentDeps) {
  return async (cmd: RunVerifierAgentCommand): Promise<RunVerifierAgentResult> => {
    const { ctx, input, iteration } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: S3_DEFINITION.agentId,
        status: "running",
        model: S3_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(S3_DEFINITION, { ctx, ...input });

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

      const norm = await normalizeS3(
        { prisma: deps.prisma },
        {
          dealId: ctx.dealId,
          runId: ctx.runId,
          output: result.output,
          iteration,
        },
      );

      return {
        output: result.output,
        shouldRedraft: norm.shouldRedraft,
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
