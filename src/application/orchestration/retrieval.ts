import type { PrismaClient } from "@prisma/client";
import type { AgentId } from "../agents/shared/agentTypes";
import type { RetrievedChunk } from "../agents/shared/retrievedChunk";

/**
 * Per-agent retrieval configuration. Lists the `peTaxonomy` tags whose
 * Documents should feed the agent, plus a chunk cap.
 *
 * For the MVP we scope retrieval by Document.routedTo[] — the agent reads
 * every chunk of every document A1 routed to it. When the corpus grows we
 * swap this loader for a pgvector + BM25 hybrid retriever (the schema
 * already has the embedding column + tsvector index ready).
 */
const RETRIEVAL_CONFIG: Record<AgentId, { maxChunks: number; routedAgent: AgentId | null }> = {
  A1: { maxChunks: 0, routedAgent: null }, // A1 receives the doc directly, not chunks
  A2: { maxChunks: 80, routedAgent: "A2" },
  A3: { maxChunks: 100, routedAgent: "A3" },
  A4: { maxChunks: 60, routedAgent: "A4" },
  A5: { maxChunks: 80, routedAgent: "A5" },
  A6: { maxChunks: 60, routedAgent: "A6" },
  A7: { maxChunks: 100, routedAgent: "A7" },
  A8: { maxChunks: 60, routedAgent: "A8" },
  A9: { maxChunks: 60, routedAgent: "A9" },
  S1: { maxChunks: 0, routedAgent: null },
  S2: { maxChunks: 0, routedAgent: null },
  S3: { maxChunks: 0, routedAgent: null },
};

export interface RetrieveForAgentDeps {
  prisma: PrismaClient;
}

export interface RetrieveForAgentArgs {
  agentId: AgentId;
  dealId: string;
}

/**
 * Returns the chunks that the agent should see, filtered by which documents
 * A1 routed to that agent.
 *
 * Order is deterministic: by Document.dealRelevance desc, then Document.id,
 * then Chunk position. Cap by `maxChunks` for cost control.
 */
export async function retrieveForAgent(
  deps: RetrieveForAgentDeps,
  args: RetrieveForAgentArgs,
): Promise<RetrievedChunk[]> {
  const cfg = RETRIEVAL_CONFIG[args.agentId];
  if (!cfg.routedAgent || cfg.maxChunks === 0) return [];

  const documents = await deps.prisma.document.findMany({
    where: {
      dealId: args.dealId,
      status: "INDEXED",
      routedTo: { has: cfg.routedAgent },
    },
    orderBy: [{ dealRelevance: "desc" }, { id: "asc" }],
    select: { id: true, filename: true },
  });
  if (documents.length === 0) return [];

  const chunks = await deps.prisma.chunk.findMany({
    where: { documentId: { in: documents.map((d) => d.id) } },
    select: {
      id: true,
      documentId: true,
      sectionRef: true,
      page: true,
      text: true,
    },
    take: cfg.maxChunks,
  });

  const filenameById = new Map(documents.map((d) => [d.id, d.filename]));
  return chunks.map((c) => ({
    id: c.id,
    documentId: c.documentId,
    filename: filenameById.get(c.documentId) ?? null,
    sectionRef: c.sectionRef,
    page: c.page,
    text: c.text,
  }));
}
