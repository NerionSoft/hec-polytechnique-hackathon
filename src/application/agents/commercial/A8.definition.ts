import type { AgentDefinition } from "../shared/agentDefinition";
import { A8_SYSTEM_PROMPT, buildA8UserPrompt, type A8Input } from "./A8.prompt";
import { A8OutputSchema, type A8Output } from "./A8.schema";

export const A8_DEFINITION: AgentDefinition<A8Input, A8Output> = {
  agentId: "A8",
  model: "google/gemini-3-flash",
  temperature: 0.1,
  systemPrompt: A8_SYSTEM_PROMPT,
  outputSchema: A8OutputSchema,
  buildUserPrompt: buildA8UserPrompt,
  concurrency: 1,
  retries: 2,
};
