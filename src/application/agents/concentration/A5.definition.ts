import type { AgentDefinition } from "../shared/agentDefinition";
import { A5_SYSTEM_PROMPT, buildA5UserPrompt, type A5Input } from "./A5.prompt";
import { A5OutputSchema, type A5Output } from "./A5.schema";

export const A5_DEFINITION: AgentDefinition<A5Input, A5Output> = {
  agentId: "A5",
  model: "google/gemini-3-flash",
  temperature: 0,
  systemPrompt: A5_SYSTEM_PROMPT,
  outputSchema: A5OutputSchema,
  buildUserPrompt: buildA5UserPrompt,
  concurrency: 1,
  retries: 2,
};
