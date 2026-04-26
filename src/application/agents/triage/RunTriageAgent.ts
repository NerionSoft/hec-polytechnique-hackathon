import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import type { AgentContext } from "../shared/agentTypes";
import { A1_DEFINITION } from "./A1.definition";
import { normalizeA1 } from "./A1.normalizer";
import type { A1Input } from "./A1.prompt";
import type { A1Output } from "./A1.schema";

export interface RunTriageAgentDeps {
  agentRunner: AgentRunner;
  prisma: PrismaClient;
}

export interface RunTriageAgentCommand {
  ctx: AgentContext;
  input: A1Input;
}

export interface RunTriageAgentResult {
  output: A1Output;
  durationMs: number;
  costCents: number | null;
}

/**
 * One A1 invocation = one document.
 *
 * 1. Open AgentOutput row (status="running") for audit / replay.
 * 2. Call the LLM.
 * 3. Persist usage + raw output JSON, status="success".
 * 4. Run the normalizer to update Document fields.
 *
 * Failures persist status="failed" + error before re-throwing.
 */
export function makeRunTriageAgent(deps: RunTriageAgentDeps) {
  return async (cmd: RunTriageAgentCommand): Promise<RunTriageAgentResult> => {
    const { ctx, input } = cmd;
    const startedAt = new Date();

    const ao = await deps.prisma.agentOutput.create({
      data: {
        runId: ctx.runId,
        agentId: A1_DEFINITION.agentId,
        documentId: input.doc_id,
        status: "running",
        model: A1_DEFINITION.model,
        startedAt,
      },
    });

    try {
      const result = await deps.agentRunner.run(A1_DEFINITION, input);

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

      await normalizeA1({ prisma: deps.prisma }, result.output);

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
