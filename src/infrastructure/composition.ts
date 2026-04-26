// Composition root: builds use-case callables with their adapters wired in.
// Module-level memoized — one instance per server lifetime.

import { prisma } from "./persistence/prisma/client";
import { SystemClock } from "./clock/SystemClock";
import { CuidIdGenerator } from "./id/CuidIdGenerator";
import { PrismaLeadRepository } from "./persistence/prisma/PrismaLeadRepository";
import { PrismaFundThesisRepository } from "./persistence/prisma/PrismaFundThesisRepository";
import { PrismaLeadEnrichmentRepository } from "./persistence/prisma/PrismaLeadEnrichmentRepository";
import { PrismaLeadScoreRepository } from "./persistence/prisma/PrismaLeadScoreRepository";
import { PrismaWebsiteSnapshotCache } from "./persistence/prisma/PrismaWebsiteSnapshotCache";
import { SireneCompanyDataSource } from "./sources/sirene/SireneCompanyDataSource";
import { VercelBlobStorage } from "./blob/VercelBlobStorage";
import { CheerioWebsiteScraper } from "./scraping/cheerio/CheerioWebsiteScraper";
import { AiGatewayLeadEnricher } from "./llm/ai-gateway/AiGatewayLeadEnricher";
import { AiGatewayOutreachDrafter } from "./llm/ai-gateway/AiGatewayOutreachDrafter";
import { PrismaEnrichmentCache } from "./llm/cache/PrismaEnrichmentCache";
import { PrismaOutreachDraftRepository } from "./persistence/prisma/PrismaOutreachDraftRepository";
import { loadEnv } from "./env";

import { makeFetchLeadsFromSirene } from "@/src/application/use-cases/leads/FetchLeadsFromSirene";
import { makeImportLeadsFromCsv } from "@/src/application/use-cases/leads/ImportLeadsFromCsv";
import { makeListLeads } from "@/src/application/use-cases/leads/ListLeads";
import { makeGetLeadById } from "@/src/application/use-cases/leads/GetLeadById";
import { makeEnrichLead } from "@/src/application/use-cases/leads/EnrichLead";
import { makeScoreLead } from "@/src/application/use-cases/leads/ScoreLead";
import {
  makeCreateThesis,
  makeListTheses,
  makeGetThesisById,
  makeUpdateThesis,
  makeDeleteThesis,
} from "@/src/application/use-cases/theses/ThesisUseCases";
import {
  makeGenerateOutreachDraft,
  makeUpdateOutreachDraft,
  makeApproveOutreachDraft,
  makeMarkOutreachSent,
  makeListOutreachDrafts,
} from "@/src/application/use-cases/outreach/OutreachUseCases";
import type { BlobStorage } from "@/src/application/ports/BlobStorage";
import type { LeadEnrichmentRepository } from "@/src/application/ports/LeadEnrichmentRepository";
import type { LeadScoreRepository } from "@/src/application/ports/LeadScoreRepository";
import type { WebsiteSnapshotCache } from "@/src/application/ports/WebsiteSnapshotCache";

export interface UseCases {
  fetchLeadsFromSirene: ReturnType<typeof makeFetchLeadsFromSirene>;
  importLeadsFromCsv: ReturnType<typeof makeImportLeadsFromCsv>;
  enrichLead: ReturnType<typeof makeEnrichLead>;
  scoreLead: ReturnType<typeof makeScoreLead>;
  listLeads: ReturnType<typeof makeListLeads>;
  getLeadById: ReturnType<typeof makeGetLeadById>;
  createThesis: ReturnType<typeof makeCreateThesis>;
  listTheses: ReturnType<typeof makeListTheses>;
  getThesisById: ReturnType<typeof makeGetThesisById>;
  updateThesis: ReturnType<typeof makeUpdateThesis>;
  deleteThesis: ReturnType<typeof makeDeleteThesis>;
  generateOutreachDraft: ReturnType<typeof makeGenerateOutreachDraft>;
  updateOutreachDraft: ReturnType<typeof makeUpdateOutreachDraft>;
  approveOutreachDraft: ReturnType<typeof makeApproveOutreachDraft>;
  markOutreachSent: ReturnType<typeof makeMarkOutreachSent>;
  listOutreachDrafts: ReturnType<typeof makeListOutreachDrafts>;
  enrichmentRepo: LeadEnrichmentRepository;
  scoreRepo: LeadScoreRepository;
  snapshotCache: WebsiteSnapshotCache;
  blobStorage: BlobStorage;
  prisma: typeof prisma;
}

let cached: UseCases | null = null;

export function getUseCases(): UseCases {
  if (cached) return cached;

  const clock = new SystemClock();
  const idGen = new CuidIdGenerator();
  const leadRepo = new PrismaLeadRepository(prisma);
  const thesisRepo = new PrismaFundThesisRepository(prisma);
  const enrichmentRepo = new PrismaLeadEnrichmentRepository(prisma);
  const scoreRepo = new PrismaLeadScoreRepository(prisma);
  const snapshotCache = new PrismaWebsiteSnapshotCache(prisma);
  const sirene = new SireneCompanyDataSource();
  const blobStorage = new VercelBlobStorage();
  const scraper = new CheerioWebsiteScraper({ clock });
  const env = loadEnv();
  const enricher = new AiGatewayLeadEnricher({ model: env.LLM_MODEL });
  const enrichmentCache = new PrismaEnrichmentCache(prisma);
  const outreachDrafter = new AiGatewayOutreachDrafter({ model: env.LLM_MODEL });
  const outreachRepo = new PrismaOutreachDraftRepository(prisma);

  cached = {
    fetchLeadsFromSirene: makeFetchLeadsFromSirene({ sirene, leadRepo, thesisRepo, clock, idGen }),
    importLeadsFromCsv: makeImportLeadsFromCsv({ leadRepo, clock, idGen }),
    enrichLead: makeEnrichLead({
      leadRepo,
      enricher,
      enrichmentCache,
      enrichmentRepo,
      scraper,
      snapshotCache,
      clock,
    }),
    scoreLead: makeScoreLead({ leadRepo, thesisRepo, enrichmentRepo, scoreRepo, clock }),
    listLeads: makeListLeads({ leadRepo }),
    getLeadById: makeGetLeadById({ leadRepo }),
    createThesis: makeCreateThesis({ thesisRepo, idGen, clock }),
    listTheses: makeListTheses({ thesisRepo }),
    getThesisById: makeGetThesisById({ thesisRepo }),
    updateThesis: makeUpdateThesis({ thesisRepo, clock }),
    deleteThesis: makeDeleteThesis({ thesisRepo }),
    generateOutreachDraft: makeGenerateOutreachDraft({
      leadRepo,
      thesisRepo,
      enrichmentRepo,
      outreachRepo,
      drafter: outreachDrafter,
      clock,
      idGen,
    }),
    updateOutreachDraft: makeUpdateOutreachDraft({
      outreachRepo,
      leadRepo,
      thesisRepo,
      clock,
    }),
    approveOutreachDraft: makeApproveOutreachDraft({
      outreachRepo,
      leadRepo,
      thesisRepo,
      clock,
    }),
    markOutreachSent: makeMarkOutreachSent({
      outreachRepo,
      leadRepo,
      thesisRepo,
      clock,
    }),
    listOutreachDrafts: makeListOutreachDrafts({
      outreachRepo,
      leadRepo,
      thesisRepo,
    }),
    enrichmentRepo,
    scoreRepo,
    snapshotCache,
    blobStorage,
    prisma,
  };
  return cached;
}
