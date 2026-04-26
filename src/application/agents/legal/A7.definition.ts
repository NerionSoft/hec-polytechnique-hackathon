import type { AgentDefinition } from "../shared/agentDefinition";
import { A7_SYSTEM_PROMPT, buildA7UserPrompt, type A7Input } from "./A7.prompt";
import { A7OutputSchema, type A7Output } from "./A7.schema";

export const A7_DEFINITION: AgentDefinition<A7Input, A7Output> = {
  agentId: "A7",
  model: "google/gemini-3-pro",
  temperature: 0.2,
  systemPrompt: A7_SYSTEM_PROMPT,
  outputSchema: A7OutputSchema,
  buildUserPrompt: buildA7UserPrompt,
  concurrency: 1,
  retries: 2,
};
