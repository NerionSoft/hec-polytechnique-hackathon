import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import type { RetrievedChunk } from "../shared/retrievedChunk";
import { normalizeFindings } from "../shared/findingNormalizer";
import { A6_DEFINITION } from "./A6.definition";
import type { A6Output } from "./A6.schema";

export interface RunDebtAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunDebtAgentCommand {
  ctx: AgentContext;
  chunks: RetrievedChunk[];
}

export interface RunDebtAgentResult {
  output: A6Output;
  findingIds: string[];
  questionIds: string[];
  durationMs: number;
  costCents: number | null;
}

export function makeRunDebtAgent(deps: RunDebtAgentDeps) {
  return async (cmd: RunDebtAgentCommand): Promise<RunDebtAgentResult> => {
    const { ctx, chunks } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A6_DEFINITION.agentId,
        status: "running",
        model: A6_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A6_DEFINITION, { ctx, chunks });

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

      // Sync net_debt_ebitda onto Deal cache when explicitly computable
      if (result.output.computed_ratios.net_debt_ebitda != null) {
        await deps.prisma.deal.update({
          where: { id: ctx.dealId },
          data: {
            netDebtEbitda: result.output.computed_ratios.net_debt_ebitda,
          },
        });
      }

      const findings = result.output.redflag_findings;
      const norm = findings.length
        ? await normalizeFindings(
            { prisma: deps.prisma },
            {
              agentId: "A6",
              dealId: ctx.dealId,
              runId: ctx.runId,
              findings,
              forceCategory: "FINANCIAL",
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
