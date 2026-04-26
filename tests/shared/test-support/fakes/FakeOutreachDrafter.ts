import { createHash } from "node:crypto";
import type {
  OutreachDrafter,
  OutreachDrafterInput,
  OutreachDrafterOutput,
} from "@/src/application/ports/OutreachDrafter";

// Deterministic fake for unit tests. NEVER used in production code paths —
// a real LLM call lives in src/infrastructure/llm/ai-gateway/AiGatewayOutreachDrafter.ts.
export class FakeOutreachDrafter implements OutreachDrafter {
  readonly draftCalls: OutreachDrafterInput[] = [];
  private next: { subject: string; body: string } | null = null;
  readonly model: string;

  constructor(model = "fake-model-v1") {
    this.model = model;
  }

  setNext(out: { subject: string; body: string }): void {
    this.next = out;
  }

  async draft(input: OutreachDrafterInput): Promise<OutreachDrafterOutput> {
    this.draftCalls.push(input);
    const subject = this.next?.subject ?? `Exploring partnership with ${input.lead.companyName}`;
    const body =
      this.next?.body ??
      [
        `Hi ${input.lead.founderName ?? "there"},`,
        "",
        `We're a European PE fund (${input.thesis.name}) currently reviewing companies in ${input.lead.country}.`,
        `${input.enrichment.suggestedOutreachAngle || "Your business profile fits our thesis."}`,
        "",
        "Would you be open to a 30-min introductory call?",
        "",
        "Best,",
        `${input.fund.senderName ?? "[Sender]"} / ${input.fund.fundName ?? "[Fund]"}`,
      ].join("\n");
    const promptHash = createHash("sha256")
      .update(`${input.lead.companyName}::${input.thesis.name}::${this.model}`)
      .digest("hex");
    return {
      subject,
      body,
      model: this.model,
      promptHash,
      promptTokens: 100,
      completionTokens: 200,
    };
  }

  // ── test helpers ──
  clear(): void {
    this.draftCalls.length = 0;
    this.next = null;
  }
}
