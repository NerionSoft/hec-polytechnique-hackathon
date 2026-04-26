import { createHash } from "node:crypto";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import type {
  OutreachDrafter,
  OutreachDrafterInput,
  OutreachDrafterOutput,
} from "@/src/application/ports/OutreachDrafter";

const DEFAULT_MODEL = "google/gemini-3-flash";
const MAX_PROMPT_CHARS = 12_000;
const SCHEMA_VERSION = "outreach-v1";

const SYSTEM_PROMPT = `You draft cold outreach emails for a European lower-mid-market private-equity fund.

Hard rules:
- Subject under 90 characters. No clickbait. No emojis. No "Re:" or "FW:" prefixes.
- Body 90 to 160 words. French if the company is French (lead.country = FR), English otherwise.
- Open with one specific observation drawn from the enrichment summary or rationale. Do NOT compliment vaguely.
- State you're a PE fund evaluating opportunities matching a specific thesis. Reference one concrete element of the thesis (a sector or country range).
- Propose a 30-min introductory call, leaving time/date open. No fake urgency.
- Sign off neutrally with [Sender] / [Fund]. Do NOT invent contact details.
- Do NOT promise valuations, multiples, or term-sheet numbers.
- Do NOT claim the fund has already analyzed the company beyond what the enrichment says.

Return ONLY a JSON object: { subject: string, body: string }.`;

const OutreachObjectSchema = z.object({
  subject: z.string().min(8).max(120),
  body: z.string().min(120).max(2000),
});

export interface AiGatewayOutreachDrafterOptions {
  model?: string;
  temperature?: number;
  maxRetries?: number;
}

export class AiGatewayOutreachDrafter implements OutreachDrafter {
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxRetries: number;

  constructor(opts: AiGatewayOutreachDrafterOptions = {}) {
    this.model = opts.model ?? DEFAULT_MODEL;
    this.temperature = opts.temperature ?? 0.6;
    this.maxRetries = opts.maxRetries ?? 2;
  }

  async draft(input: OutreachDrafterInput): Promise<OutreachDrafterOutput> {
    const userPrompt = buildUserPrompt(input);
    if (userPrompt.length > MAX_PROMPT_CHARS) {
      throw new Error(
        `Outreach prompt exceeds ${MAX_PROMPT_CHARS} chars (got ${userPrompt.length}).`,
      );
    }

    const promptHash = createHash("sha256")
      .update(`${SYSTEM_PROMPT}||${userPrompt}||${this.model}||${SCHEMA_VERSION}`)
      .digest("hex");

    try {
      const { experimental_output, usage } = await generateText({
        model: this.model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        experimental_output: Output.object({ schema: OutreachObjectSchema }),
        temperature: this.temperature,
        maxRetries: this.maxRetries,
      });

      const obj = experimental_output;
      console.info(
        `[OutreachDrafter] ${input.lead.companyName} | model=${this.model} | tokens in=${usage?.inputTokens ?? "?"} out=${usage?.outputTokens ?? "?"}`,
      );

      return {
        subject: obj.subject,
        body: obj.body,
        model: this.model,
        promptHash,
        promptTokens: usage?.inputTokens ?? null,
        completionTokens: usage?.outputTokens ?? null,
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error(
          `LLM did not return a valid outreach draft: ${error.cause instanceof Error ? error.cause.message : "unknown"}`,
        );
      }
      throw error;
    }
  }
}

function buildUserPrompt(input: OutreachDrafterInput): string {
  const { lead, thesis, enrichment, fund } = input;
  const parts: string[] = [];

  parts.push("## LEAD");
  parts.push(`Company: ${lead.companyName}`);
  parts.push(`Country: ${lead.country}`);
  if (lead.sector) parts.push(`Sector: ${lead.sector}`);
  if (lead.website) parts.push(`Website: ${lead.website}`);
  if (lead.founderName) parts.push(`Founder / contact: ${lead.founderName}`);

  parts.push("");
  parts.push("## FUND THESIS");
  parts.push(`Name: ${thesis.name}`);
  if (thesis.sectors.length) parts.push(`Sector focus: ${thesis.sectors.join(", ")}`);
  if (thesis.countries.length) parts.push(`Geography: ${thesis.countries.join(", ")}`);
  const range = formatRange(thesis.minRevenueEur, thesis.maxRevenueEur);
  if (range) parts.push(`Revenue band: ${range}`);

  parts.push("");
  parts.push("## ENRICHMENT");
  parts.push(`Summary: ${enrichment.businessSummary}`);
  if (enrichment.investmentRationale.length) {
    parts.push("Rationale:");
    enrichment.investmentRationale.slice(0, 4).forEach((r) => parts.push(`- ${r}`));
  }
  if (enrichment.suggestedOutreachAngle) {
    parts.push(`Suggested angle: ${enrichment.suggestedOutreachAngle}`);
  }

  parts.push("");
  parts.push("## SENDER");
  parts.push(`Sender name: ${fund.senderName ?? "[Sender]"}`);
  parts.push(`Fund name: ${fund.fundName ?? "[Fund]"}`);

  parts.push("");
  parts.push("## TASK\nWrite the cold outreach email per the rules.");
  return parts.join("\n");
}

function formatRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (v: number) => `€${(v / 1_000_000).toFixed(0)}M`;
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `≥ ${fmt(min)}`;
  return `≤ ${fmt(max!)}`;
}
