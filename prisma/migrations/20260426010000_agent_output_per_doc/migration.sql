-- Allow per-document AgentOutput rows for fan-out agents (A1).
-- The previous unique key (runId, agentId) prevented A1 from writing one row
-- per document; the second call onward failed with P2002 and the error was
-- swallowed by the worker pool, leaving 46/47 docs with empty `routedTo` and
-- starving the downstream specialists.

-- 1. Add nullable documentId column + FK + index.
ALTER TABLE "agent_output" ADD COLUMN "documentId" TEXT;

ALTER TABLE "agent_output"
  ADD CONSTRAINT "agent_output_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "document"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "agent_output_documentId_idx" ON "agent_output"("documentId");

-- 2. Replace the unique key.
DROP INDEX "agent_output_runId_agentId_key";
CREATE UNIQUE INDEX "agent_output_runId_agentId_documentId_key"
  ON "agent_output"("runId", "agentId", "documentId");
