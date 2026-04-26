-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "lead_source" AS ENUM ('MANUAL', 'CSV_IMPORT', 'SIRENE', 'COMPANY_WEBSITE');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('NEW', 'ENRICHING', 'ENRICHED', 'SCORED', 'QUALIFIED', 'REJECTED', 'CONTACTED', 'DATA_ROOM_OPENED');

-- CreateEnum
CREATE TYPE "score_decision" AS ENUM ('REJECT', 'WATCHLIST', 'OUTREACH');

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
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

