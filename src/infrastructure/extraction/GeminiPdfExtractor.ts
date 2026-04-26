import { generateText } from "ai";
import type { PdfExtractor, PdfExtractResult } from "@/src/application/ports/PdfExtractor";

const DEFAULT_MODEL = "google/gemini-3-flash";

/**
 * PDF text extractor that delegates to Gemini via the Vercel AI Gateway.
 *
 * Why not a local lib (unpdf / pdf-parse / pdfjs-dist)?
 *   - Turbopack intercepts the dynamic `await import("pdf.worker.mjs")` that
 *     pdfjs-dist (and thus pdf-parse) issues at runtime, mangles the URL into
 *     its internal `[project]/... [app-route]` namespace and fails to resolve.
 *     This is a known Next.js 15 + Turbopack limitation that no amount of
 *     `serverExternalPackages` config gets around for libraries that load
 *     their workers via dynamic import at runtime.
 *   - unpdf bundles PDF.js inline and avoids the dynamic import, but it has
 *     its own pathological cases on certain PDFs that infinite-loop the
 *     parser without raising — manifesting as the `timeout_pdf_extract_*`
 *     errors we hit earlier.
 *
 * Going through Gemini sidesteps both. We already have the AI Gateway
 * configured (used by every agent), Gemini Flash is cheap (~$0.0005/PDF for
 * a small business doc), and the model handles every PDF encoding flavour
 * we've thrown at it without configuration. Cost for a 100-doc VDR is
 * negligible (~$0.05) compared to the value of zero infra surface area.
 *
 * Page boundaries are encoded as form-feed (`\f`) so the chunker can recover
 * them — same contract as the previous adapters.
 */
export class GeminiPdfExtractor implements PdfExtractor {
  constructor(private readonly opts: { model?: string; maxRetries?: number } = {}) {}

  async extract(input: ArrayBuffer | Uint8Array): Promise<PdfExtractResult> {
    const data = input instanceof Uint8Array ? input : new Uint8Array(input);

    const { text } = await generateText({
      model: this.opts.model ?? DEFAULT_MODEL,
      maxRetries: this.opts.maxRetries ?? 1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract the full text content of this PDF. Preserve the reading " +
                "order and section headers. Insert a single form-feed character " +
                '(U+000C, "\\f") between pages. Do NOT summarise, comment, ' +
                "translate, or wrap the output — return only the raw extracted " +
                "text. If the PDF is image-only with no extractable text layer, " +
                'return exactly the string "[NO_EXTRACTABLE_TEXT]".',
            },
            {
              type: "file",
              data,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
    });

    if (text.trim() === "[NO_EXTRACTABLE_TEXT]") {
      return { text: "", pageCount: 0 };
    }

    // Page count = (number of \f) + 1 — Gemini insert one between pages, no
    // trailing one. If the model didn't insert any (single-page doc) we still
    // count 1.
    const pageCount = (text.match(/\f/g)?.length ?? 0) + 1;
    return { text, pageCount };
  }
}
