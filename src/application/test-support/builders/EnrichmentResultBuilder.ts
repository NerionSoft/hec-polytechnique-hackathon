import { SCORE_DECISION, type ScoreDecision } from "../../domain/lead/enums";
import type { EnrichmentResult } from "../../ports/types";

export class EnrichmentResultBuilder {
  private result: EnrichmentResult;

  private constructor(result: EnrichmentResult) {
    this.result = result;
  }

  static default(): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({
      businessSummary: "Profitable B2B SaaS with strong recurring revenue.",
      investmentRationale: ["Recurring revenue", "Founder-led", "Niche market"],
      concerns: ["Small team"],
      suggestedOutreachAngle: "Operational leverage in PE workflows.",
      peFitScore: 72,
      peFitDecision: SCORE_DECISION.OUTREACH,
      reasons: ["Sector match", "Revenue in range"],
      missingInfo: [],
      model: "fake-model",
      promptHash: "fake-hash",
      promptTokens: 100,
      completionTokens: 200,
    });
  }

  withDecision(decision: ScoreDecision): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({ ...this.result, peFitDecision: decision });
  }
  withScore(score: number): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({ ...this.result, peFitScore: score });
  }
  withPromptHash(hash: string): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({ ...this.result, promptHash: hash });
  }
  withModel(model: string): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({ ...this.result, model });
  }
  withTokens(
    promptTokens: number | null,
    completionTokens: number | null,
  ): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({
      ...this.result,
      promptTokens,
      completionTokens,
    });
  }
  withBusinessSummary(s: string): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({ ...this.result, businessSummary: s });
  }
  withRationale(r: string[]): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({ ...this.result, investmentRationale: r });
  }
  withConcerns(c: string[]): EnrichmentResultBuilder {
    return new EnrichmentResultBuilder({ ...this.result, concerns: c });
  }

  build(): EnrichmentResult {
    return { ...this.result };
  }
}
