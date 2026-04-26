import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import { S1_DEFINITION } from "./S1.definition";
import { normalizeS1 } from "./S1.normalizer";
import type { S1Input } from "./S1.prompt";
import type { S1Output } from "./S1.schema";

export interface RunThesisAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunThesisAgentCommand {
  ctx: AgentContext;
  input: Omit<S1Input, "ctx">;
}

export interface RunThesisAgentResult {
  output: S1Output;
  thesisFit: number;
  durationMs: number;
  costCents: number | null;
}

export function makeRunThesisAgent(deps: RunThesisAgentDeps) {
  return async (cmd: RunThesisAgentCommand): Promise<RunThesisAgentResult> => {
    const { ctx, input } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: S1_DEFINITION.agentId,
        status: "running",
        model: S1_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(S1_DEFINITION, {
        ctx,
        ...input,
      });

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

      await normalizeS1(
        { prisma: deps.prisma },
        { dealId: ctx.dealId, runId: ctx.runId, output: result.output },
      );

      return {
        output: result.output,
        thesisFit: result.output.thesis_fit_score,
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
