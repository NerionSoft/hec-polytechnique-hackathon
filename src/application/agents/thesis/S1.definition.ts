import type { AgentDefinition } from "../shared/agentDefinition";
import { S1_SYSTEM_PROMPT, buildS1UserPrompt, type S1Input } from "./S1.prompt";
import { S1OutputSchema, type S1Output } from "./S1.schema";

export const S1_DEFINITION: AgentDefinition<S1Input, S1Output> = {
  agentId: "S1",
  model: "google/gemini-3-pro",
  temperature: 0.3,
  systemPrompt: S1_SYSTEM_PROMPT,
  outputSchema: S1OutputSchema,
  buildUserPrompt: buildS1UserPrompt,
  concurrency: 1,
  retries: 2,
};
