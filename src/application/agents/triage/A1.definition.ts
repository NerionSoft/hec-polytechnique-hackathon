import type { AgentDefinition } from "../shared/agentDefinition";
import { A1_SYSTEM_PROMPT, buildA1UserPrompt, type A1Input } from "./A1.prompt";
import { A1OutputSchema, type A1Output } from "./A1.schema";

export const A1_DEFINITION: AgentDefinition<A1Input, A1Output> = {
  agentId: "A1",
  model: "google/gemini-3-flash",
  temperature: 0.1,
  systemPrompt: A1_SYSTEM_PROMPT,
  outputSchema: A1OutputSchema,
  buildUserPrompt: buildA1UserPrompt,
  concurrency: 50,
  retries: 2,
};
