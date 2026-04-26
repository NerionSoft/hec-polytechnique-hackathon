-- Idempotent setup for pgvector + chunk indexes that Prisma can't model.
-- Run this any time the DB has been wiped or you're not sure of the state.

CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW cosine index for semantic retrieval on Chunk.embedding.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chunk_embedding_hnsw_idx') THEN
    CREATE INDEX "chunk_embedding_hnsw_idx"
      ON "chunk" USING hnsw ("embedding" vector_cosine_ops);
  END IF;
END $$;

-- BM25-style full-text search column + GIN index for hybrid retrieval.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chunk' AND column_name = 'text_tsv'
  ) THEN
    ALTER TABLE "chunk"
      ADD COLUMN "text_tsv" tsvector
      GENERATED ALWAYS AS (to_tsvector('english', "text")) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chunk_text_tsv_idx') THEN
    CREATE INDEX "chunk_text_tsv_idx" ON "chunk" USING gin ("text_tsv");
  END IF;
END $$;
