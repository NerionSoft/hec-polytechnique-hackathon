import type { z } from "zod";
import type { AgentId } from "./agentTypes";

/**
 * Per-agent static definition.
 *
 * `outputSchema` is a Zod schema used by the AI SDK for structured output
 * generation; the model is constrained to produce JSON matching it
 * (server-side via `Output.object`).
 *
 * `buildUserPrompt` receives the typed `Input` (per-agent shape) and returns
 * the full user message. Retrieval-fed chunks are passed inside Input.
 */
export interface AgentDefinition<Input, Output> {
  agentId: AgentId;
  /** Vercel AI Gateway model ID — e.g. "google/gemini-3-flash". */
  model: string;
  /** Sampling temperature. */
  temperature: number;
  /** Static system prompt (citation contract is prepended automatically). */
  systemPrompt: string;
  /** Schema enforced server-side and validated client-side. */
  outputSchema: z.ZodType<Output>;
  /** Build the user message from the agent-specific input. */
  buildUserPrompt: (input: Input) => string;
  /** Concurrency hint per Inngest step (used by orchestrator). */
  concurrency?: number;
  /** Inngest retry count for this step. */
  retries?: number;
}
