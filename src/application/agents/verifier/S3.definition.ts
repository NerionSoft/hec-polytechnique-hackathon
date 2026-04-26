import type { AgentDefinition } from "../shared/agentDefinition";
import { S3_SYSTEM_PROMPT, buildS3UserPrompt, type S3Input } from "./S3.prompt";
import { S3OutputSchema, type S3Output } from "./S3.schema";

export const S3_DEFINITION: AgentDefinition<S3Input, S3Output> = {
  agentId: "S3",
  model: "google/gemini-3-flash",
  temperature: 0,
  systemPrompt: S3_SYSTEM_PROMPT,
  outputSchema: S3OutputSchema,
  buildUserPrompt: buildS3UserPrompt,
  concurrency: 1,
  retries: 1,
};
