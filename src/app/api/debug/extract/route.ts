import { NextResponse } from "next/server";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { GeminiPdfExtractor } from "@/src/infrastructure/extraction/GeminiPdfExtractor";
import { VercelBlobStorage } from "@/src/infrastructure/blob/VercelBlobStorage";
import { chunkText } from "@/src/application/orchestration/chunker";

export const runtime = "nodejs";

const STEP_TIMEOUT_MS = 15_000;

/**
 * GET /api/debug/extract?docId=<id>
 *
 * Local diagnostic endpoint. Pulls one Document, downloads its blob via the
 * @vercel/blob SDK (NOT vanilla fetch — see VercelBlobStorage for the
 * rationale), runs unpdf, chunks. Returns a JSON trace pinning exactly where
 * the pipeline hangs.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const docId = url.searchParams.get("docId");
  if (!docId) {
    return NextResponse.json({ error: "missing docId query param" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) {
    return NextResponse.json({ error: "document not found" }, { status: 404 });
  }

  const trace: Record<string, unknown> = {
    docId,
    filename: doc.filename,
    blobUrl: doc.blobUrl,
    status: doc.status,
  };

  // Step 1: download via SDK with abortable timeout
  const blobStorage = new VercelBlobStorage();
  let buf: ArrayBuffer | null = null;
  {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), STEP_TIMEOUT_MS);
    const t0 = Date.now();
    try {
      const blob = await blobStorage.download(doc.blobUrl, { signal: ac.signal });
      buf = await new Response(blob.stream).arrayBuffer();
      trace.download = {
        durationMs: Date.now() - t0,
        bytesRead: buf.byteLength,
        contentType: blob.contentType,
        size: blob.size,
        etag: blob.etag,
      };
    } catch (err) {
      trace.failedAt = "download";
      trace.downloadError = serialize(err);
      trace.downloadDurationMs = Date.now() - t0;
      return NextResponse.json(trace, { status: 200 });
    } finally {
      clearTimeout(timer);
    }
  }

  // Step 2: extract text
  let text = "";
  let pageCount = 0;
  {
    const t0 = Date.now();
    try {
      const extractor = new GeminiPdfExtractor();
      const result = await extractor.extract(buf);
      text = result.text;
      pageCount = result.pageCount;
      trace.extract = {
        durationMs: Date.now() - t0,
        pageCount,
        textLength: text.length,
        preview: text.slice(0, 200).replace(/\s+/g, " ").trim(),
      };
    } catch (err) {
      trace.failedAt = "extract";
      trace.extractError = serialize(err);
      trace.extractDurationMs = Date.now() - t0;
      return NextResponse.json(trace, { status: 200 });
    }
  }

  // Step 3: chunk
  {
    const t0 = Date.now();
    try {
      const pieces = chunkText(text);
      trace.chunk = {
        durationMs: Date.now() - t0,
        chunkCount: pieces.length,
        firstChunkPreview: pieces[0]?.text.slice(0, 200) ?? null,
      };
    } catch (err) {
      trace.failedAt = "chunk";
      trace.chunkError = serialize(err);
    }
  }

  return NextResponse.json(trace, { status: 200 });
}

function serialize(err: unknown): object {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 8),
    };
  }
  return { error: String(err) };
}
