import type { AgentDefinition } from "../shared/agentDefinition";
import { A6_SYSTEM_PROMPT, buildA6UserPrompt, type A6Input } from "./A6.prompt";
import { A6OutputSchema, type A6Output } from "./A6.schema";

export const A6_DEFINITION: AgentDefinition<A6Input, A6Output> = {
  agentId: "A6",
  model: "google/gemini-3-flash",
  temperature: 0,
  systemPrompt: A6_SYSTEM_PROMPT,
  outputSchema: A6OutputSchema,
  buildUserPrompt: buildA6UserPrompt,
  concurrency: 1,
  retries: 2,
};
