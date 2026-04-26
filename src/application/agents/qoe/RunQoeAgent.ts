import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { normalizeFindings } from "../shared/findingNormalizer";
import { A3_DEFINITION } from "./A3.definition";
import type { A3Output } from "./A3.schema";

export interface RunQoeAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunQoeAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunQoeAgentResult {
  output: A3Output;
  findingIds: string[];
  questionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunQoeAgent(deps: RunQoeAgentDeps) {
  return async (cmd: RunQoeAgentCommand): Promise<RunQoeAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A3_DEFINITION.agentId,
        status: "running",
        model: A3_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A3_DEFINITION, { ctx, chunks });

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

      const { findingIds, questionIds } = await normalizeFindings(
        { prisma: deps.prisma },
        {
          agentId: "A3",
          dealId: ctx.dealId,
          runId: ctx.runId,
          findings: result.output.findings,
          forceCategory: "FINANCIAL",
        },
      );

      return {
        output: result.output,
        findingIds,
        questionIds,
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
