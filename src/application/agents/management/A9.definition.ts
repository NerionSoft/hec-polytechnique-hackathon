import type { AgentDefinition } from "../shared/agentDefinition";
import { A9_SYSTEM_PROMPT, buildA9UserPrompt, type A9Input } from "./A9.prompt";
import { A9OutputSchema, type A9Output } from "./A9.schema";

export const A9_DEFINITION: AgentDefinition<A9Input, A9Output> = {
  agentId: "A9",
  model: "google/gemini-3-flash",
  temperature: 0,
  systemPrompt: A9_SYSTEM_PROMPT,
  outputSchema: A9OutputSchema,
  buildUserPrompt: buildA9UserPrompt,
  concurrency: 1,
  retries: 2,
};
