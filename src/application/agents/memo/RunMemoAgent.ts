import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import { S2_DEFINITION } from "./S2.definition";
import { normalizeS2 } from "./S2.normalizer";
import type { S2Input } from "./S2.prompt";
import type { S2Output } from "./S2.schema";

export interface RunMemoAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunMemoAgentCommand {
  ctx: AgentContext;
  input: Omit<S2Input, "ctx">;
}

export interface RunMemoAgentResult {
  output: S2Output;
  memoId: string;
  sectionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunMemoAgent(deps: RunMemoAgentDeps) {
  return async (cmd: RunMemoAgentCommand): Promise<RunMemoAgentResult> => {
    const { ctx, input } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: S2_DEFINITION.agentId,
        status: "running",
        model: S2_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(S2_DEFINITION, { ctx, ...input });

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

      const norm = await normalizeS2(
        { prisma: deps.prisma },
        { dealId: ctx.dealId, runId: ctx.runId, output: result.output },
      );

      return {
        output: result.output,
        memoId: norm.memoId,
        sectionIds: norm.sectionIds,
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
