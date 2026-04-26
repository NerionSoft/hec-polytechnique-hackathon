import { createHash } from "node:crypto";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import type { LeadEnricher } from "@/src/application/ports/LeadEnricher";
import type { EnrichInput, EnrichmentResult } from "@/src/application/ports/types";
import { EnrichmentObjectSchema, SCHEMA_VERSION, SYSTEM_PROMPT } from "./enrichmentSchema";

const DEFAULT_MODEL = "google/gemini-3-flash";
const MAX_PROMPT_CHARS = 20_000;

export interface AiGatewayLeadEnricherOptions {
  model?: string;
  temperature?: number;
  maxRetries?: number;
}

export class AiGatewayLeadEnricher implements LeadEnricher {
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxRetries: number;

  constructor(opts: AiGatewayLeadEnricherOptions = {}) {
    this.model = opts.model ?? DEFAULT_MODEL;
    this.temperature = opts.temperature ?? 0.2;
    this.maxRetries = opts.maxRetries ?? 2;
  }

  computePromptHash(input: EnrichInput): string {
    const userPrompt = buildUserPrompt(input);
    return createHash("sha256")
      .update(`${SYSTEM_PROMPT}||${userPrompt}||${this.model}||${SCHEMA_VERSION}`)
      .digest("hex");
  }

  async enrich(input: EnrichInput): Promise<EnrichmentResult> {
    const userPrompt = buildUserPrompt(input);
    if (userPrompt.length > MAX_PROMPT_CHARS) {
      throw new Error(`User prompt exceeds ${MAX_PROMPT_CHARS} chars (got ${userPrompt.length}).`);
    }

    const promptHash = this.computePromptHash(input);

    try {
      const { experimental_output, usage } = await generateText({
        model: this.model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        experimental_output: Output.object({ schema: EnrichmentObjectSchema }),
        temperature: this.temperature,
        maxRetries: this.maxRetries,
      });

      const obj = experimental_output;
      console.info(
        `[LeadEnricher] ${input.lead.companyName} | model=${this.model} | tokens in=${usage?.inputTokens ?? "?"} out=${usage?.outputTokens ?? "?"} | hash=${promptHash.slice(0, 8)}`,
      );

      return {
        ...obj,
        model: this.model,
        promptHash,
        promptTokens: usage?.inputTokens ?? null,
        completionTokens: usage?.outputTokens ?? null,
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        console.error("[LeadEnricher] schema validation failed", {
          cause: error.cause,
          textPreview: error.text?.slice(0, 200),
        });
        throw new Error(
          `LLM did not return a valid enrichment object: ${error.cause instanceof Error ? error.cause.message : "unknown"}`,
        );
      }
      throw error;
    }
  }
}

function buildUserPrompt(input: EnrichInput): string {
  const { lead, website } = input;
  const parts: string[] = [];

  parts.push("## LEAD");
  parts.push(`Company: ${lead.companyName}`);
  if (lead.website) parts.push(`Website: ${lead.website}`);
  parts.push(`Country: ${lead.country}`);
  if (lead.sector) parts.push(`Sector: ${lead.sector}`);
  if (lead.employeeCount !== null) parts.push(`Employees: ~${lead.employeeCount}`);
  if (lead.estimatedRevenueEur !== null)
    parts.push(`Estimated revenue (EUR): ${lead.estimatedRevenueEur}`);
  if (lead.founderName) parts.push(`Founder: ${lead.founderName}`);

  if (website) {
    parts.push("");
    parts.push("## WEBSITE SNAPSHOT");
    if (website.title) parts.push(`Page title: ${website.title}`);
    if (website.description) parts.push(`Meta description: ${website.description}`);
    if (website.h1s.length) parts.push(`H1: ${website.h1s.slice(0, 4).join(" | ")}`);
    if (website.h2s.length) parts.push(`H2: ${website.h2s.slice(0, 6).join(" | ")}`);
    if (website.emails.length) parts.push(`Contact emails: ${website.emails.join(", ")}`);
    if (website.socialLinks.length)
      parts.push(`Social links: ${website.socialLinks.slice(0, 4).join(", ")}`);
  } else {
    parts.push("");
    parts.push("## WEBSITE SNAPSHOT");
    parts.push("(none — flag as missing info)");
  }

  parts.push("");
  parts.push(
    "## TASK\nProduce a structured PE screening assessment for this lead. Stay strictly within the provided data; do not invent.",
  );
  return parts.join("\n");
}
