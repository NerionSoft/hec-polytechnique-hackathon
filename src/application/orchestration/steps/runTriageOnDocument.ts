import type { PrismaClient } from "@prisma/client";
import type { AgentRunner } from "../../ports/AgentRunner";
import { makeRunTriageAgent } from "../../agents/triage/RunTriageAgent";
import type { AgentContext } from "../../agents/shared/agentTypes";

export interface RunTriageOnDocumentDeps {
  prisma: PrismaClient;
  agentRunner: AgentRunner;
}

export interface RunTriageOnDocumentArgs {
  ctx: AgentContext;
  documentId: string;
}

const HEAD_LIMIT = 1500;
const TAIL_LIMIT = 800;

/**
 * Wraps RunTriageAgent for a single Document row by stitching together its
 * head + tail text from the persisted chunks. Used by the orchestrator's
 * A1 fan-out step.
 */
export async function runTriageOnDocument(
  deps: RunTriageOnDocumentDeps,
  args: RunTriageOnDocumentArgs,
): Promise<void> {
  const doc = await deps.prisma.document.findUnique({
    where: { id: args.documentId },
    include: {
      chunks: {
        orderBy: { id: "asc" },
        select: { text: true, page: true },
      },
    },
  });
  if (!doc) throw new Error(`document ${args.documentId} not found`);

  const fullText = doc.chunks.map((c) => c.text).join("\n\n");
  const head = fullText.slice(0, HEAD_LIMIT);
  const tail = fullText.length > HEAD_LIMIT ? fullText.slice(-TAIL_LIMIT) : "";

  const run = makeRunTriageAgent({
    agentRunner: deps.agentRunner,
    prisma: deps.prisma,
  });

  await run({
    ctx: args.ctx,
    input: {
      doc_id: doc.id,
      filename: doc.filename,
      vdr_folder: null,
      head_text: head,
      tail_text: tail,
      page_count: doc.pageCount,
      byte_size: doc.byteSize,
    },
  });
}
