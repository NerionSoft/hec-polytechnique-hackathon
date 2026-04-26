import type { PrismaClient, Prisma } from "@prisma/client";
import type { EnrichmentCache } from "@/src/application/ports/LeadEnricher";
import type { EnrichmentResult } from "@/src/application/ports/types";

export class PrismaEnrichmentCache implements EnrichmentCache {
  constructor(private readonly prisma: PrismaClient) {}

  async get(promptHash: string): Promise<EnrichmentResult | null> {
    const row = await this.prisma.enrichmentCache.findUnique({ where: { promptHash } });
    if (!row) return null;
    return {
      ...(row.enrichmentJson as unknown as Omit<
        EnrichmentResult,
        "model" | "promptHash" | "promptTokens" | "completionTokens"
      >),
      model: row.model,
      promptHash: row.promptHash,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
    };
  }

  async set(result: EnrichmentResult): Promise<void> {
    const { model, promptHash, promptTokens, completionTokens, ...payload } = result;
    await this.prisma.enrichmentCache.upsert({
      where: { promptHash },
      create: {
        promptHash,
        model,
        promptTokens,
        completionTokens,
        enrichmentJson: payload as unknown as Prisma.InputJsonValue,
      },
      update: {
        model,
        promptTokens,
        completionTokens,
        enrichmentJson: payload as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
