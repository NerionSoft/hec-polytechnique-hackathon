import type { PrismaClient } from "@prisma/client";
import type { BlobStorage } from "../../ports/BlobStorage";
import type { PdfExtractor } from "../../ports/PdfExtractor";
import { approxTokenCount, chunkText } from "../chunker";

export interface IngestDocumentsDeps {
  prisma: PrismaClient;
  pdfExtractor: PdfExtractor;
  blobStorage: BlobStorage;
}

export interface IngestDocumentsArgs {
  dealId: string;
  /** Process at most this many documents per invocation. */
  batchSize?: number;
  /**
   * How many docs are processed in flight. Lower than you'd think because
   * `unpdf` is CPU-bound and runs on the Node main thread — 8 parallel
   * extractions don't go 8× faster, they share the same CPU and each takes
   * 8× longer wall-clock, blowing the per-doc timeout. 4 is the sweet spot
   * to overlap downloads with extraction without starving any single doc.
   */
  concurrency?: number;
  /**
   * Per-doc wall-clock budget in ms (download + extract). Default 90s. PDFs
   * with 100+ pages or dense text can take 10–30s of pure CPU on unpdf;
   * with concurrent workers that can balloon under load.
   */
  perDocTimeoutMs?: number;
}

export interface IngestResult {
  processed: number;
  failed: number;
  totalChunks: number;
}

/**
 * Phase 0 step. For every Document not yet INDEXED:
 *   1. Flip status to EXTRACTING
 *   2. Download from blob storage (via the SDK port — abortable, typed errors)
 *   3. Extract text via unpdf, chunk by §-section
 *   4. Persist Chunk[] rows
 *   5. Flip Document.status to INDEXED (or FAILED on error / empty extraction)
 *
 * Documents are processed in **concurrent batches** so a single hung PDF
 * cannot block the queue, and each doc carries an `AbortController` whose
 * timeout propagates to the underlying socket via the SDK.
 *
 * Idempotent: re-running picks up UPLOADED, EXTRACTING (zombie) and FAILED
 * docs; INDEXED docs are skipped. Existing chunks for a doc are wiped
 * before re-indexing.
 */
export async function ingestDocuments(
  deps: IngestDocumentsDeps,
  args: IngestDocumentsArgs,
): Promise<IngestResult> {
  const concurrency = args.concurrency ?? 4;
  const timeoutMs = args.perDocTimeoutMs ?? 30_000;

  const docs = await deps.prisma.document.findMany({
    where: {
      dealId: args.dealId,
      status: { in: ["UPLOADED", "EXTRACTING", "FAILED"] },
    },
    take: args.batchSize ?? 1_000,
    orderBy: { createdAt: "asc" },
  });

  if (docs.length === 0) {
    console.info(`[ingest] no docs to process for deal ${args.dealId}`);
    return { processed: 0, failed: 0, totalChunks: 0 };
  }
  console.info(
    `[ingest] starting on ${docs.length} docs · concurrency=${concurrency} · timeout=${timeoutMs}ms/doc`,
  );

  let processed = 0;
  let failed = 0;
  let totalChunks = 0;

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, docs.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= docs.length) return;
      const doc = docs[idx];

      await deps.prisma.document
        .update({ where: { id: doc.id }, data: { status: "EXTRACTING" } })
        .catch(() => undefined);

      const startedAt = Date.now();
      try {
        const { pieces, pageCount, byteSize } = await downloadAndExtract(
          deps,
          doc.blobUrl,
          timeoutMs,
        );

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
            byteSize,
          },
        });
        processed++;
        console.info(
          `[ingest] ${doc.filename} ${pieces.length > 0 ? "INDEXED" : "FAILED (no chunks)"}` +
            ` · ${pieces.length} chunks · ${Date.now() - startedAt}ms`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[ingest] ${doc.filename} failed after ${Date.now() - startedAt}ms:`,
          message,
        );
        await Promise.all([
          deps.prisma.document
            .update({ where: { id: doc.id }, data: { status: "FAILED" } })
            .catch(() => undefined),
          deps.prisma.dealAuditEvent
            .create({
              data: {
                dealId: args.dealId,
                kind: "ingest_failed",
                entity: doc.filename,
                payload: { docId: doc.id, blobUrl: doc.blobUrl, error: message },
              },
            })
            .catch(() => undefined),
        ]);
        failed++;
      }
    }
  });

  await Promise.all(workers);

  return { processed, failed, totalChunks };
}

/**
 * Single doc pipeline: download via the SDK port → buffer → unpdf → chunk.
 *
 * The `AbortController` is the ONLY thing keeping this honest. Promise-only
 * timeouts let sockets leak — we've been bitten by that. Don't replace.
 */
async function downloadAndExtract(
  deps: IngestDocumentsDeps,
  blobUrl: string,
  timeoutMs: number,
): Promise<{
  pieces: ReturnType<typeof chunkText>;
  pageCount: number;
  byteSize: number;
}> {
  const startedAt = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const blob = await deps.blobStorage.download(blobUrl, { signal: ac.signal });
    const buf = await new Response(blob.stream).arrayBuffer();

    // Magic-bytes check. PDFs start with "%PDF-" (0x25 0x50 0x44 0x46 0x2D).
    // If the SDK silently returned a 404 HTML page or garbage, fail fast with
    // a useful message instead of letting unpdf burn the entire timeout
    // budget on a non-PDF buffer.
    assertIsPdf(buf, blobUrl);

    // unpdf has no cancellation hook; CPU-bound work on an in-memory buffer.
    // Compute the genuine remaining budget (timeoutMs minus already-elapsed
    // download time). Floor at 5s so a slow download doesn't immediately
    // starve a small extract.
    const elapsed = Date.now() - startedAt;
    const extractBudget = Math.max(5_000, timeoutMs - elapsed);
    const extracted = await raceTimeout(
      deps.pdfExtractor.extract(buf),
      extractBudget,
      "pdf_extract",
    );

    const pieces = chunkText(extracted.text);
    return { pieces, pageCount: extracted.pageCount, byteSize: buf.byteLength };
  } finally {
    clearTimeout(timer);
  }
}

function assertIsPdf(buf: ArrayBuffer, blobUrl: string): void {
  if (buf.byteLength < 5) {
    throw new Error(`download_too_small: only ${buf.byteLength} bytes received from ${blobUrl}`);
  }
  const head = new Uint8Array(buf, 0, 5);
  // %PDF-
  const isPdf =
    head[0] === 0x25 &&
    head[1] === 0x50 &&
    head[2] === 0x44 &&
    head[3] === 0x46 &&
    head[4] === 0x2d;
  if (!isPdf) {
    const preview = new TextDecoder("utf-8", { fatal: false })
      .decode(new Uint8Array(buf, 0, Math.min(64, buf.byteLength)))
      .replace(/\s+/g, " ")
      .trim();
    throw new Error(
      `download_not_pdf: first bytes are not %PDF- header (size=${buf.byteLength}, preview="${preview}") for ${blobUrl}`,
    );
  }
}

function raceTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout_${label}_${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
