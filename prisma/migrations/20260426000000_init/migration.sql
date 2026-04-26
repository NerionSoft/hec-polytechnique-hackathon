-- =========================================================================
-- Athena — single consolidated init migration
--
-- Builds the full schema in one file: Better Auth tables (user, session,
-- account, verification), sourcing domain (lead, contact, lead_enrichment,
-- lead_score, fund_thesis, website_snapshot, enrichment_cache,
-- import_batch, outreach_draft) AND the DD pipeline (deal, document, chunk,
-- dd_run, agent_output, finding, citation, management_question, memo,
-- memo_section, financial_snapshot, dd_audit_event, plus the M:N joins).
-- pgvector + HNSW + tsvector indexes are included so a fresh DB is
-- immediately ready for retrieval.
--
-- Replace this file in a single-shot whenever the schema is reset; do NOT
-- diff sub-migrations on top.
-- =========================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Enable pgvector extension (required by chunk.embedding below).
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "lead_source" AS ENUM ('MANUAL', 'CSV_IMPORT', 'SIRENE', 'COMPANY_WEBSITE');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('NEW', 'ENRICHING', 'ENRICHED', 'SCORED', 'QUALIFIED', 'REJECTED', 'CONTACTED', 'DATA_ROOM_OPENED');

-- CreateEnum
CREATE TYPE "score_decision" AS ENUM ('REJECT', 'WATCHLIST', 'OUTREACH');

-- CreateEnum
CREATE TYPE "outreach_status" AS ENUM ('DRAFT', 'APPROVED', 'SENT');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "tokenType" TEXT,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_thesis" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectors" TEXT[],
    "countries" TEXT[],
    "minRevenueEur" DECIMAL(14,2),
    "maxRevenueEur" DECIMAL(14,2),
    "preferences" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fund_thesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead" (
    "id" TEXT NOT NULL,
    "source" "lead_source" NOT NULL,
    "sourceRef" TEXT,
    "importBatchId" TEXT,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "website" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "sector" TEXT,
    "napCode" TEXT,
    "employeeCount" INTEGER,
    "estimatedRevenue" DECIMAL(14,2),
    "founderName" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'NEW',
    "thesisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_enrichment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "businessSummary" TEXT NOT NULL,
    "investmentRationale" TEXT[],
    "concerns" TEXT[],
    "suggestedOutreachAngle" TEXT,
    "peFitScore" INTEGER NOT NULL DEFAULT 0,
    "peFitDecision" "score_decision" NOT NULL,
    "reasons" TEXT[],
    "missingInfo" TEXT[],
    "enrichmentModel" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_enrichment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_score" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "decision" "score_decision" NOT NULL,
    "reasons" TEXT[],
    "missingInfo" TEXT[],
    "thesisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_snapshot" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "h1s" TEXT[],
    "h2s" TEXT[],
    "emails" TEXT[],
    "socialLinks" TEXT[],
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment_cache" (
    "promptHash" TEXT NOT NULL,
    "enrichmentJson" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_cache_pkey" PRIMARY KEY ("promptHash")
);

-- CreateTable
CREATE TABLE "outreach_draft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "thesisId" TEXT,
    "recipient" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "outreach_status" NOT NULL DEFAULT 'DRAFT',
    "model" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batch" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "source" "lead_source" NOT NULL,
    "sourceFileUrl" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "errorsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "fund_thesis_ownerId_idx" ON "fund_thesis"("ownerId");

-- CreateIndex
CREATE INDEX "lead_status_idx" ON "lead"("status");

-- CreateIndex
CREATE INDEX "lead_sector_idx" ON "lead"("sector");

-- CreateIndex
CREATE INDEX "lead_country_idx" ON "lead"("country");

-- CreateIndex
CREATE INDEX "lead_thesisId_idx" ON "lead"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_source_sourceRef_key" ON "lead"("source", "sourceRef");

-- CreateIndex
CREATE INDEX "contact_leadId_idx" ON "contact"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_enrichment_leadId_key" ON "lead_enrichment"("leadId");

-- CreateIndex
CREATE INDEX "lead_enrichment_promptHash_idx" ON "lead_enrichment"("promptHash");

-- CreateIndex
CREATE UNIQUE INDEX "lead_score_leadId_key" ON "lead_score"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "website_snapshot_url_key" ON "website_snapshot"("url");

-- CreateIndex
CREATE INDEX "outreach_draft_leadId_idx" ON "outreach_draft"("leadId");

-- CreateIndex
CREATE INDEX "import_batch_uploaderId_idx" ON "import_batch"("uploaderId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_thesis" ADD CONSTRAINT "fund_thesis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "fund_thesis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_enrichment" ADD CONSTRAINT "lead_enrichment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_score" ADD CONSTRAINT "lead_score_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_draft" ADD CONSTRAINT "outreach_draft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================
-- DD pipeline domain (deal → documents → chunks → runs → findings → memo)
-- =========================================================================

-- CreateEnum
CREATE TYPE "deal_stage" AS ENUM ('IN_DD', 'IC_READY', 'DECIDED');

-- CreateEnum
CREATE TYPE "deal_decision" AS ENUM ('PASSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "doc_category" AS ENUM ('COMMERCIAL', 'FINANCIAL', 'LEGAL', 'HR', 'TAX');

-- CreateEnum
CREATE TYPE "doc_status" AS ENUM ('UPLOADED', 'EXTRACTING', 'INDEXED', 'FAILED');

-- CreateEnum
CREATE TYPE "run_status" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "finding_category" AS ENUM ('FINANCIAL', 'LEGAL', 'COMMERCIAL', 'OPERATIONAL', 'ESG');

-- CreateEnum
CREATE TYPE "confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "question_status" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'SENT', 'ANSWERED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "memo_status" AS ENUM ('DRAFT', 'REVIEW', 'FINAL', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "deal" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "thesisId" TEXT,
    "stage" "deal_stage" NOT NULL DEFAULT 'IN_DD',
    "decision" "deal_decision",
    "revenueEur" DECIMAL(14,2),
    "ebitdaEur" DECIMAL(14,2),
    "ebitdaMargin" DECIMAL(5,4),
    "growthYoy" DECIMAL(5,4),
    "netDebtEbitda" DECIMAL(5,2),
    "employees" INTEGER,
    "founded" INTEGER,
    "thesisFit" INTEGER,
    "redFlagsCount" INTEGER NOT NULL DEFAULT 0,
    "timeSavedDays" DECIMAL(4,1),
    "coverage" DECIMAL(3,2),
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "byteSize" INTEGER,
    "pageCount" INTEGER,
    "status" "doc_status" NOT NULL DEFAULT 'UPLOADED',
    "category" "doc_category",
    "peTaxonomy" TEXT[],
    "dealRelevance" INTEGER,
    "riskSignal" INTEGER,
    "routedTo" TEXT[],
    "redflagKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sectionRef" TEXT,
    "page" INTEGER,
    "text" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "embedding" vector(1536),

    CONSTRAINT "chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dd_run" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "triggeredById" TEXT,
    "status" "run_status" NOT NULL DEFAULT 'QUEUED',
    "phase" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalTokens" INTEGER,
    "totalCostCents" INTEGER,
    "citationPassRate" DECIMAL(5,4),
    "errorJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dd_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_output" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output" JSONB,
    "promptHash" TEXT,
    "model" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costCents" INTEGER,
    "durationMs" INTEGER,
    "errorJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "agent_output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "severity" "severity" NOT NULL,
    "category" "finding_category" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "detail" TEXT,
    "confidence" "confidence" NOT NULL,
    "impact" TEXT,
    "status" "review_status" NOT NULL DEFAULT 'PENDING_REVIEW',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "primaryCitationId" TEXT,
    "suggestedQuestion" TEXT,
    "exposureEur" DECIMAL(14,2),
    "raisedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citation" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "documentId" TEXT,
    "chunkId" TEXT,
    "sectionRef" TEXT,
    "page" INTEGER,
    "excerpt" TEXT NOT NULL,
    "confidence" "confidence" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "usedIn" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "management_question" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "topic" "finding_category" NOT NULL,
    "body" TEXT NOT NULL,
    "derivedFromFindingId" TEXT,
    "status" "question_status" NOT NULL DEFAULT 'PENDING_REVIEW',
    "raisedBy" TEXT NOT NULL,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "management_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "status" "memo_status" NOT NULL DEFAULT 'DRAFT',
    "reviewProgress" DECIMAL(3,2),
    "pendingItems" INTEGER,
    "pdfBlobUrl" TEXT,
    "lastEditedById" TEXT,
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_section" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "orderIdx" INTEGER NOT NULL,

    CONSTRAINT "memo_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_snapshot" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "trendJson" JSONB NOT NULL,
    "bridgeJson" JSONB NOT NULL,
    "concentrationJson" JSONB NOT NULL,
    "retentionJson" JSONB NOT NULL,
    "workingCapitalJson" JSONB NOT NULL,
    "kpiJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dd_audit_event" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "actorId" TEXT,
    "kind" TEXT NOT NULL,
    "entity" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dd_audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FindingCitations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FindingCitations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MemoSectionCitations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemoSectionCitations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "deal_leadId_key" ON "deal"("leadId");

-- CreateIndex
CREATE INDEX "deal_ownerId_idx" ON "deal"("ownerId");

-- CreateIndex
CREATE INDEX "deal_stage_idx" ON "deal"("stage");

-- CreateIndex
CREATE INDEX "document_dealId_idx" ON "document"("dealId");

-- CreateIndex
CREATE INDEX "chunk_documentId_idx" ON "chunk"("documentId");

-- CreateIndex
CREATE INDEX "dd_run_dealId_idx" ON "dd_run"("dealId");

-- CreateIndex
CREATE INDEX "dd_run_status_idx" ON "dd_run"("status");

-- CreateIndex
CREATE INDEX "agent_output_agentId_idx" ON "agent_output"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_output_runId_agentId_key" ON "agent_output"("runId", "agentId");

-- CreateIndex
CREATE INDEX "finding_dealId_severity_idx" ON "finding"("dealId", "severity");

-- CreateIndex
CREATE INDEX "finding_dealId_category_idx" ON "finding"("dealId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "finding_dealId_displayId_key" ON "finding"("dealId", "displayId");

-- CreateIndex
CREATE INDEX "citation_dealId_idx" ON "citation"("dealId");

-- CreateIndex
CREATE INDEX "citation_documentId_idx" ON "citation"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "citation_dealId_displayId_key" ON "citation"("dealId", "displayId");

-- CreateIndex
CREATE INDEX "management_question_dealId_status_idx" ON "management_question"("dealId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "management_question_dealId_displayId_key" ON "management_question"("dealId", "displayId");

-- CreateIndex
CREATE UNIQUE INDEX "memo_dealId_key" ON "memo"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "memo_runId_key" ON "memo"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "memo_section_memoId_sectionKey_key" ON "memo_section"("memoId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "financial_snapshot_dealId_key" ON "financial_snapshot"("dealId");

-- CreateIndex
CREATE INDEX "dd_audit_event_dealId_createdAt_idx" ON "dd_audit_event"("dealId", "createdAt");

-- CreateIndex
CREATE INDEX "_FindingCitations_B_index" ON "_FindingCitations"("B");

-- CreateIndex
CREATE INDEX "_MemoSectionCitations_B_index" ON "_MemoSectionCitations"("B");

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "fund_thesis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dd_run" ADD CONSTRAINT "dd_run_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_output" ADD CONSTRAINT "agent_output_runId_fkey" FOREIGN KEY ("runId") REFERENCES "dd_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding" ADD CONSTRAINT "finding_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding" ADD CONSTRAINT "finding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "dd_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding" ADD CONSTRAINT "finding_primaryCitationId_fkey" FOREIGN KEY ("primaryCitationId") REFERENCES "citation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citation" ADD CONSTRAINT "citation_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citation" ADD CONSTRAINT "citation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citation" ADD CONSTRAINT "citation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "chunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_question" ADD CONSTRAINT "management_question_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_question" ADD CONSTRAINT "management_question_runId_fkey" FOREIGN KEY ("runId") REFERENCES "dd_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_question" ADD CONSTRAINT "management_question_derivedFromFindingId_fkey" FOREIGN KEY ("derivedFromFindingId") REFERENCES "finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo" ADD CONSTRAINT "memo_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo" ADD CONSTRAINT "memo_runId_fkey" FOREIGN KEY ("runId") REFERENCES "dd_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo_section" ADD CONSTRAINT "memo_section_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "memo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_snapshot" ADD CONSTRAINT "financial_snapshot_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dd_audit_event" ADD CONSTRAINT "dd_audit_event_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FindingCitations" ADD CONSTRAINT "_FindingCitations_A_fkey" FOREIGN KEY ("A") REFERENCES "citation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FindingCitations" ADD CONSTRAINT "_FindingCitations_B_fkey" FOREIGN KEY ("B") REFERENCES "finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemoSectionCitations" ADD CONSTRAINT "_MemoSectionCitations_A_fkey" FOREIGN KEY ("A") REFERENCES "citation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemoSectionCitations" ADD CONSTRAINT "_MemoSectionCitations_B_fkey" FOREIGN KEY ("B") REFERENCES "memo_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- HNSW index for cosine similarity on embeddings (approximate nearest neighbour)
CREATE INDEX "chunk_embedding_hnsw_idx"
  ON "chunk" USING hnsw ("embedding" vector_cosine_ops);

-- BM25-style full-text search column + GIN index for hybrid retrieval
ALTER TABLE "chunk"
  ADD COLUMN "text_tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('english', "text")) STORED;

CREATE INDEX "chunk_text_tsv_idx" ON "chunk" USING gin ("text_tsv");
