import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { normalizeFindings } from "../shared/findingNormalizer";
import { A7_DEFINITION } from "./A7.definition";
import type { A7Output } from "./A7.schema";

export interface RunLegalAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunLegalAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunLegalAgentResult {
  output: A7Output;
  findingIds: string[];
  questionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunLegalAgent(deps: RunLegalAgentDeps) {
  return async (cmd: RunLegalAgentCommand): Promise<RunLegalAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A7_DEFINITION.agentId,
        status: "running",
        model: A7_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A7_DEFINITION, { ctx, chunks });

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

      const norm = await normalizeFindings(
        { prisma: deps.prisma },
        {
          agentId: "A7",
          dealId: ctx.dealId,
          runId: ctx.runId,
          findings: result.output.findings,
          forceCategory: "LEGAL",
        },
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
