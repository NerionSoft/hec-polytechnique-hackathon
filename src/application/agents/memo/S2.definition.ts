import type { AgentDefinition } from "../shared/agentDefinition";
import { S2_SYSTEM_PROMPT, buildS2UserPrompt, type S2Input } from "./S2.prompt";
import { S2OutputSchema, type S2Output } from "./S2.schema";

export const S2_DEFINITION: AgentDefinition<S2Input, S2Output> = {
  agentId: "S2",
  model: "google/gemini-3-pro",
  temperature: 0.4,
  systemPrompt: S2_SYSTEM_PROMPT,
  outputSchema: S2OutputSchema,
  buildUserPrompt: buildS2UserPrompt,
  concurrency: 1,
  retries: 2,
};
