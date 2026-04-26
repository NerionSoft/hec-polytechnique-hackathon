/**
 * Port for PDF → text extraction. Returned text preserves a "\f" form-feed
 * between pages so downstream chunkers can track the page number.
 */
export interface PdfExtractor {
  extract(input: ArrayBuffer | Uint8Array): Promise<PdfExtractResult>;
}

export interface PdfExtractResult {
  text: string;
  pageCount: number;
}
