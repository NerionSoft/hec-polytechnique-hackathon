import { createHash } from "node:crypto";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import type { AgentRunner } from "@/src/application/ports/AgentRunner";
import type { AgentDefinition } from "@/src/application/agents/shared/agentDefinition";
import type { AgentRunResult } from "@/src/application/agents/shared/agentTypes";
import { CITATION_CONTRACT } from "@/src/application/agents/shared/citationContract";

interface AiGatewayAgentRunnerOptions {
  /** Override default retry count (default = 2). */
  maxRetries?: number;
}

/**
 * Vercel AI SDK + AI Gateway implementation of AgentRunner.
 *
 * Uses `generateText` with `experimental_output: Output.object({ schema })`
 * so the LLM returns JSON validated against the agent's Zod schema.
 * Failure to produce valid JSON raises `NoObjectGeneratedError`, which we
 * surface as a typed AgentRunFailure.
 */
export class AiGatewayAgentRunner implements AgentRunner {
  private readonly maxRetries: number;

  constructor(opts: AiGatewayAgentRunnerOptions = {}) {
    this.maxRetries = opts.maxRetries ?? 2;
  }

  async run<Input, Output_>(
    def: AgentDefinition<Input, Output_>,
    input: Input,
  ): Promise<AgentRunResult<Output_>> {
    const userPrompt = def.buildUserPrompt(input);
    const systemPrompt = `${CITATION_CONTRACT}\n\n${def.systemPrompt}`;
    const promptHash = createHash("sha256")
      .update(`${def.agentId}|${def.model}|${systemPrompt}|${userPrompt}`)
      .digest("hex");

    const startedAt = Date.now();

    try {
      const { experimental_output, usage } = await generateText({
        model: def.model,
        system: systemPrompt,
        prompt: userPrompt,
        experimental_output: Output.object({ schema: def.outputSchema }),
        temperature: def.temperature,
        maxRetries: this.maxRetries,
      });

      const durationMs = Date.now() - startedAt;
      const tokensIn = usage?.inputTokens ?? null;
      const tokensOut = usage?.outputTokens ?? null;

      console.info(
        `[Agent ${def.agentId}] model=${def.model} tokens in=${tokensIn ?? "?"} out=${tokensOut ?? "?"} hash=${promptHash.slice(0, 8)} ${durationMs}ms`,
      );

      return {
        agentId: def.agentId,
        output: experimental_output as Output_,
        usage: {
          promptTokens: tokensIn,
          completionTokens: tokensOut,
          costCents: estimateCostCents(def.model, tokensIn, tokensOut),
        },
        durationMs,
        promptHash,
        model: def.model,
      };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        console.error(`[Agent ${def.agentId}] schema validation failed`, {
          cause: err.cause,
          textPreview: err.text?.slice(0, 200),
        });
        throw new Error(
          `Agent ${def.agentId} did not return a valid object: ${
            err.cause instanceof Error ? err.cause.message : "unknown"
          }`,
        );
      }
      throw err;
    }
  }
}

/**
 * Cost estimation in cents for telemetry / kanban.
 * Pricing approx (USD per 1M tokens) — keep in sync with provider console.
 */
function estimateCostCents(
  model: string,
  tokensIn: number | null,
  tokensOut: number | null,
): number | null {
  if (tokensIn == null || tokensOut == null) return null;
  const rates: Record<string, [number, number]> = {
    "google/gemini-3-flash": [0.075, 0.3],
    "google/gemini-3-pro": [1.25, 5.0],
  };
  const [inRate, outRate] = rates[model] ?? [1, 5];
  const usd = (tokensIn * inRate + tokensOut * outRate) / 1_000_000;
  return Math.round(usd * 100);
}
