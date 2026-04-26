import type { AgentDefinition } from "../shared/agentDefinition";
import { A2_SYSTEM_PROMPT, buildA2UserPrompt, type A2Input } from "./A2.prompt";
import { A2OutputSchema, type A2Output } from "./A2.schema";

export const A2_DEFINITION: AgentDefinition<A2Input, A2Output> = {
  agentId: "A2",
  model: "google/gemini-3-flash",
  temperature: 0,
  systemPrompt: A2_SYSTEM_PROMPT,
  outputSchema: A2OutputSchema,
  buildUserPrompt: buildA2UserPrompt,
  concurrency: 1,
  retries: 2,
};
