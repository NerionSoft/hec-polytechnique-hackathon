import type { AgentDefinition } from "../shared/agentDefinition";
import { A4_SYSTEM_PROMPT, buildA4UserPrompt, type A4Input } from "./A4.prompt";
import { A4OutputSchema, type A4Output } from "./A4.schema";

export const A4_DEFINITION: AgentDefinition<A4Input, A4Output> = {
  agentId: "A4",
  model: "google/gemini-3-flash",
  temperature: 0,
  systemPrompt: A4_SYSTEM_PROMPT,
  outputSchema: A4OutputSchema,
  buildUserPrompt: buildA4UserPrompt,
  concurrency: 1,
  retries: 2,
};
