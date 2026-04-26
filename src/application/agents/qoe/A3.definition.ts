import type { AgentDefinition } from "../shared/agentDefinition";
import { A3_SYSTEM_PROMPT, buildA3UserPrompt, type A3Input } from "./A3.prompt";
import { A3OutputSchema, type A3Output } from "./A3.schema";

export const A3_DEFINITION: AgentDefinition<A3Input, A3Output> = {
  agentId: "A3",
  model: "google/gemini-3-pro",
  temperature: 0.2,
  systemPrompt: A3_SYSTEM_PROMPT,
  outputSchema: A3OutputSchema,
  buildUserPrompt: buildA3UserPrompt,
  concurrency: 1,
  retries: 2,
};
