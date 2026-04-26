import type { PrismaClient } from "@prisma/client";
import type { PdfExtractor } from "../../ports/PdfExtractor";
import { approxTokenCount, chunkText } from "../chunker";

export interface IngestDocumentsDeps {
  prisma: PrismaClient;
  pdfExtractor: PdfExtractor;
  fetch: typeof fetch;
}

export interface IngestDocumentsArgs {
  dealId: string;
  /** Process at most this many documents per invocation (Inngest step batching). */
  batchSize?: number;
}

export interface IngestResult {
  processed: number;
  failed: number;
  totalChunks: number;
}

/**
 * Phase 0 step. Pull every Document with status=UPLOADED, fetch the blob,
 * extract text via unpdf, chunk it, persist Chunk rows, flip Document status
 * to EXTRACTING then INDEXED (or FAILED on extraction error).
 *
 * Idempotent: documents already in INDEXED status are skipped. Existing
 * Chunk rows for a document being re-indexed are deleted first.
 */
export async function ingestDocuments(
  deps: IngestDocumentsDeps,
  args: IngestDocumentsArgs,
): Promise<IngestResult> {
  const docs = await deps.prisma.document.findMany({
    where: { dealId: args.dealId, status: "UPLOADED" },
    take: args.batchSize ?? 100,
  });

  let processed = 0;
  let failed = 0;
  let totalChunks = 0;

  for (const doc of docs) {
    await deps.prisma.document.update({
      where: { id: doc.id },
      data: { status: "EXTRACTING" },
    });

    try {
      const response = await deps.fetch(doc.blobUrl);
      if (!response.ok) {
        throw new Error(`Blob fetch failed: HTTP ${response.status}`);
      }
      const buf = await response.arrayBuffer();
      const { text, pageCount } = await deps.pdfExtractor.extract(buf);
      const pieces = chunkText(text);

      // Wipe any stale chunks (e.g. from a prior failed re-index).
      await deps.prisma.chunk.deleteMany({ where: { documentId: doc.id } });

      if (pieces.length > 0) {
        await deps.prisma.chunk.createMany({
          data: pieces.map((p) => ({
            documentId: doc.id,
            sectionRef: p.sectionRef,
            page: p.page,
            text: p.text,
            tokenCount: approxTokenCount(p.text),
          })),
        });
        totalChunks += pieces.length;
      }

      await deps.prisma.document.update({
        where: { id: doc.id },
        data: {
          status: pieces.length > 0 ? "INDEXED" : "FAILED",
          pageCount,
          byteSize: buf.byteLength,
        },
      });
      processed++;
    } catch (err) {
      console.error(`[ingest] ${doc.filename} failed:`, (err as Error).message);
      await deps.prisma.document.update({
        where: { id: doc.id },
        data: { status: "FAILED" },
      });
      failed++;
    }
  }

  return { processed, failed, totalChunks };
}
