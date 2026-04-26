/**
 * Shape of a chunk fed to retrieval-driven agents (A2..A9).
 * The orchestrator builds these by joining `Chunk` rows with their parent
 * `Document` metadata; the agent prompt renders them under "RELEVANT CHUNKS".
 */
export interface RetrievedChunk {
  id: string;
  documentId: string;
  filename: string | null;
  sectionRef: string | null;
  page: number | null;
  text: string;
}

export function renderChunks(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "(no chunks retrieved — flag every required field as gap)";
  return chunks
    .map(
      (c) =>
        `--- chunk_id=${c.id} doc_id=${c.documentId} ${
          c.filename ? `file="${c.filename}" ` : ""
        }${c.sectionRef ?? ""}${c.page != null ? ` page=${c.page}` : ""} ---\n${c.text}`,
    )
    .join("\n\n");
}
