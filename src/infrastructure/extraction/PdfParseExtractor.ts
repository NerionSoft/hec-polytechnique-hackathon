import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import type { PdfExtractor, PdfExtractResult } from "@/src/application/ports/PdfExtractor";

/**
 * `pdf-parse` (>= 2.x) wraps `pdfjs-dist/legacy` with a friendlier Node API.
 *
 * Worker resolution
 * -----------------
 * Next.js (Turbopack) does NOT copy `pdf.worker.mjs` into `.next/dev/server/
 * chunks/`, so pdf-parse's default "fake worker" auto-import fails with
 * `Cannot find module .../pdf.worker.mjs`. We resolve the worker path from
 * the actual installed package via `createRequire` and register it with
 * `PDFParse.setWorker()` once at module load. This works in both `pnpm dev`
 * (Turbopack) and a Vercel build because `pdfjs-dist` is a transitive runtime
 * dep of pdf-parse and is therefore present in node_modules at runtime.
 */
const require = createRequire(import.meta.url);

let workerConfigured = false;
function ensureWorkerConfigured(): void {
  if (workerConfigured) return;
  try {
    const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    workerConfigured = true;
  } catch (err) {
    // Surface a clear error rather than the cryptic "fake worker failed".
    throw new Error(
      `pdf_worker_resolve_failed: could not locate pdfjs-dist/legacy/build/pdf.worker.mjs in node_modules. ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export class PdfParseExtractor implements PdfExtractor {
  async extract(input: ArrayBuffer | Uint8Array): Promise<PdfExtractResult> {
    ensureWorkerConfigured();

    // pdf-parse "takes ownership" of TypedArrays passed in `data`. We hand it
    // a fresh Uint8Array view to keep the original ArrayBuffer untouched in
    // case the caller still needs it.
    const data = input instanceof Uint8Array ? new Uint8Array(input) : new Uint8Array(input);

    const parser = new PDFParse({ data, verbosity: 0 });
    try {
      const result = await parser.getText();
      // Pages joined with form-feed (\f) so the chunker can recover page
      // boundaries — same contract as the previous unpdf adapter.
      const text = result.pages.map((p) => p.text).join("\f");
      return {
        text,
        pageCount: result.total,
      };
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
}
