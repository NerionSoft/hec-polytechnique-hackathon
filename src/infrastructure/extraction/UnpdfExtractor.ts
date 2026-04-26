import type { PdfExtractor, PdfExtractResult } from "@/src/application/ports/PdfExtractor";

/**
 * unpdf-based PDF extractor. Works in Node and Vercel serverless (no native
 * deps). Pages are joined with a form-feed character so the chunker can
 * recover page boundaries.
 */
export class UnpdfExtractor implements PdfExtractor {
  async extract(input: ArrayBuffer | Uint8Array): Promise<PdfExtractResult> {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const buf = input instanceof Uint8Array ? input : new Uint8Array(input);
    const pdf = await getDocumentProxy(buf);
    const result = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(result.text) ? result.text : [result.text];
    return {
      text: pages.join("\f"),
      pageCount: pages.length,
    };
  }
}
