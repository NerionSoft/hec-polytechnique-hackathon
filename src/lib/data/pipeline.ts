import "server-only";
import type {
  Deal,
  DealAuditEvent,
  DealStage,
  Finding,
  Lead,
  ManagementQuestion,
  Memo as DbMemo,
  MemoSection as DbMemoSection,
  FinancialSnapshot as DbFinancialSnapshot,
} from "@prisma/client";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import {
  deals as mockDeals,
  getDeal as getMockDeal,
  quarterStats as mockQuarterStats,
  type Deal as KanbanDeal,
  type Stage,
} from "@/src/lib/mock/deals";
import { redFlagsForDeal as mockRedFlagsForDeal, type RedFlag } from "@/src/lib/mock/red-flags";
import { questionsForDeal as mockQuestionsForDeal, type Question } from "@/src/lib/mock/questions";
import { auditForDeal as mockAuditForDeal, type AuditEntry } from "@/src/lib/mock/audit";
import { memoHelios, type Memo as MockMemo } from "@/src/lib/mock/memo";

const COUNTRY_FLAG: Record<string, string> = {
  FR: "🇫🇷",
  DE: "🇩🇪",
  DK: "🇩🇰",
  EE: "🇪🇪",
  ES: "🇪🇸",
  IE: "🇮🇪",
  NL: "🇳🇱",
  CH: "🇨🇭",
  PT: "🇵🇹",
  BE: "🇧🇪",
  GB: "🇬🇧",
  IT: "🇮🇹",
  AT: "🇦🇹",
  SE: "🇸🇪",
  NO: "🇳🇴",
  FI: "🇫🇮",
  PL: "🇵🇱",
};

function flagFor(country: string | null | undefined): string {
  if (!country) return "🏳️";
  return COUNTRY_FLAG[country.toUpperCase()] ?? "🏳️";
}

function leadStatusToStage(status: Lead["status"]): Stage | null {
  switch (status) {
    case "NEW":
      return "sourced";
    case "ENRICHING":
    case "ENRICHED":
      return "enriched";
    case "SCORED":
    case "QUALIFIED":
      return "scored";
    case "CONTACTED":
      return "contacted";
    case "DATA_ROOM_OPENED":
      return "engaged";
    case "REJECTED":
      return null;
    default:
      return null;
  }
}

function dealStageToStage(stage: DealStage): Stage {
  switch (stage) {
    case "IN_DD":
      return "in_dd";
    case "IC_READY":
      return "ic_ready";
    case "DECIDED":
      return "decided";
  }
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function leadToKanbanDeal(lead: Lead): KanbanDeal | null {
  const stage = leadStatusToStage(lead.status);
  if (!stage) return null;
  const revenue = num(lead.estimatedRevenue) / 1_000_000;
  return {
    id: lead.id,
    name: lead.companyName,
    sector: lead.sector ?? "—",
    geo: lead.country ?? "FR",
    flag: flagFor(lead.country),
    revenue,
    ebitda: 0,
    ebitdaMargin: 0,
    growth: 0,
    netDebtEbitda: 0,
    employees: lead.employeeCount ?? 0,
    founded: 0,
    stage,
    thesisFit: null,
    redFlags: 0,
    timeSavedDays: 0,
    coverage: 0,
    owner: null,
    nextAction: nextActionForLead(lead.status),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

function nextActionForLead(status: Lead["status"]): string {
  switch (status) {
    case "NEW":
      return "Awaiting enrichment";
    case "ENRICHING":
      return "Enrichment in progress";
    case "ENRICHED":
      return "Pending scoring";
    case "SCORED":
      return "Awaiting outreach approval";
    case "QUALIFIED":
      return "Qualified — ready for outreach";
    case "CONTACTED":
      return "Outreach sent";
    case "DATA_ROOM_OPENED":
      return "VDR access granted";
    default:
      return "—";
  }
}

function dealToKanbanDeal(deal: Deal & { lead: Lead | null }): KanbanDeal {
  const lead = deal.lead;
  const country = lead?.country ?? "FR";
  return {
    id: deal.id,
    name: lead?.companyName ?? "Unnamed deal",
    sector: lead?.sector ?? "—",
    geo: country,
    flag: flagFor(country),
    revenue: num(deal.revenueEur) / 1_000_000,
    ebitda: num(deal.ebitdaEur) / 1_000_000,
    ebitdaMargin: num(deal.ebitdaMargin),
    growth: num(deal.growthYoy),
    netDebtEbitda: num(deal.netDebtEbitda),
    employees: deal.employees ?? lead?.employeeCount ?? 0,
    founded: deal.founded ?? 0,
    stage: dealStageToStage(deal.stage),
    decision:
      deal.decision === "PASSED" ? "passed" : deal.decision === "REJECTED" ? "rejected" : undefined,
    thesisFit: deal.thesisFit ?? null,
    redFlags: deal.redFlagsCount,
    timeSavedDays: num(deal.timeSavedDays),
    coverage: num(deal.coverage),
    owner: deal.ownerId,
    nextAction: deal.nextAction ?? "—",
    updatedAt: deal.updatedAt.toISOString(),
  };
}

export async function listPipelineDeals(): Promise<KanbanDeal[]> {
  // The kanban only displays real Deal rows. Pre-promotion leads live on
  // /sources as a separate inbox.
  try {
    const deals = await prisma.deal.findMany({ include: { lead: true } });
    const dbDeals = deals.map(dealToKanbanDeal);
    if (dbDeals.length === 0) return [...mockDeals];
    return dbDeals;
  } catch {
    // DB unreachable — fall back to mock.
    return [...mockDeals];
  }
}

export async function findPipelineDeal(id: string): Promise<KanbanDeal | null> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { lead: true },
    });
    if (deal) return dealToKanbanDeal(deal);

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (lead) return leadToKanbanDeal(lead);
  } catch {
    // ignore — fall through to mock
  }
  return getMockDeal(id) ?? null;
}

export type PipelineEntityKind = "deal" | "lead" | "mock";

export async function findPipelineEntityKind(id: string): Promise<PipelineEntityKind | null> {
  try {
    const deal = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
    if (deal) return "deal";
    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (lead) return "lead";
  } catch {
    // ignore — fall through to mock
  }
  return getMockDeal(id) ? "mock" : null;
}

function severityFromDb(s: Finding["severity"]): RedFlag["severity"] {
  return s.toLowerCase() as RedFlag["severity"];
}

function findingCategoryFromDb(c: Finding["category"]): RedFlag["category"] {
  return c.toLowerCase() as RedFlag["category"];
}

function reviewStatusFromDb(s: Finding["status"]): RedFlag["status"] {
  return s.toLowerCase() as RedFlag["status"];
}

function confidenceFromDb(c: Finding["confidence"]): RedFlag["confidence"] {
  return c.toLowerCase() as RedFlag["confidence"];
}

type FindingWithCitation = Finding & {
  primaryCitation: {
    id: string;
    documentId: string | null;
    sectionRef: string | null;
    page: number | null;
  } | null;
};

function findingToRedFlag(f: FindingWithCitation): RedFlag {
  const cite = f.primaryCitation;
  return {
    id: f.displayId || f.id,
    dealId: f.dealId,
    severity: severityFromDb(f.severity),
    category: findingCategoryFromDb(f.category),
    title: f.title,
    summary: f.summary ?? "",
    detail: f.detail ?? "",
    confidence: confidenceFromDb(f.confidence),
    status: reviewStatusFromDb(f.status),
    approvedBy: f.approvedById ?? undefined,
    approvedAt: f.approvedAt?.toISOString(),
    source: {
      docId: cite?.documentId ?? "",
      page: cite?.page ?? 1,
      line: cite?.sectionRef ?? undefined,
    },
    suggestedQuestion: f.suggestedQuestion ?? "",
    impact: f.impact ?? "",
    raisedBy: f.raisedBy === "ai" ? "ai" : "human",
    createdAt: f.createdAt.toISOString(),
  };
}

export async function listPipelineRedFlags(dealId: string): Promise<RedFlag[]> {
  try {
    const findings = await prisma.finding.findMany({
      where: { dealId },
      include: {
        primaryCitation: {
          select: { id: true, documentId: true, sectionRef: true, page: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (findings.length > 0) {
      return findings.map((f) => findingToRedFlag(f as FindingWithCitation));
    }
  } catch {
    // ignore — fall back to mock
  }
  return mockRedFlagsForDeal(dealId);
}

function questionTopicFromDb(t: ManagementQuestion["topic"]): Question["topic"] {
  switch (t) {
    case "FINANCIAL":
      return "financial";
    case "LEGAL":
      return "legal";
    case "COMMERCIAL":
      return "commercial";
    case "OPERATIONAL":
      return "operational";
    case "ESG":
      return "operational";
  }
}

function questionStatusFromDb(s: ManagementQuestion["status"]): Question["status"] {
  switch (s) {
    case "PENDING_REVIEW":
      return "pending_review";
    case "APPROVED":
      return "approved";
    case "SENT":
      return "sent";
    case "ANSWERED":
      return "answered";
    case "DISMISSED":
      return "pending_review";
  }
}

function questionToView(q: ManagementQuestion): Question {
  const isAi = q.raisedBy === "ai";
  return {
    id: q.displayId || q.id,
    dealId: q.dealId,
    topic: questionTopicFromDb(q.topic),
    body: q.body,
    derivedFrom: q.derivedFromFindingId ?? undefined,
    status: questionStatusFromDb(q.status),
    raisedBy: isAi ? "AI agent" : q.raisedBy,
    raisedById: isAi ? "ai" : q.raisedBy,
    createdAt: q.createdAt.toISOString(),
  };
}

export async function listPipelineQuestions(dealId: string): Promise<Question[]> {
  try {
    const qs = await prisma.managementQuestion.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
    });
    if (qs.length > 0) return qs.map(questionToView);
  } catch {
    // ignore — fall back to mock
  }
  return mockQuestionsForDeal(dealId);
}

function auditEventToView(e: DealAuditEvent): AuditEntry {
  // Surface payload.error / payload.message inline so the UI doesn't need to
  // know about the JSON shape. Keeps the AuditEntry type narrow.
  const payload = (e.payload ?? null) as {
    error?: string;
    message?: string;
    runId?: string;
    durationMs?: number;
    docCount?: number;
    ok?: number;
    failed?: number;
    processed?: number;
    totalChunks?: number;
  } | null;

  // Compose a friendly detail line for batch events like phase0_completed
  // or phase1_triage_completed when no error message is set.
  let detail: string | null = payload?.error ?? payload?.message ?? null;
  if (!detail && payload) {
    if (payload.processed != null && payload.totalChunks != null) {
      detail = `${payload.processed} docs · ${payload.totalChunks} chunks · ${payload.failed ?? 0} failed`;
    } else if (payload.ok != null && payload.failed != null && payload.docCount != null) {
      detail = `${payload.ok}/${payload.docCount} ok · ${payload.failed} failed`;
    } else if (payload.docCount != null) {
      detail = `${payload.docCount} docs queued`;
    }
  }

  return {
    id: e.id,
    dealId: e.dealId,
    actor: e.actorId ?? "ai",
    action: e.kind,
    target: e.entity ?? "",
    detail,
    durationMs: payload?.durationMs ?? null,
    timestamp: e.createdAt.toISOString(),
  };
}

export async function listPipelineAudit(dealId: string): Promise<AuditEntry[]> {
  try {
    const events = await prisma.dealAuditEvent.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
    });
    if (events.length > 0) return events.map(auditEventToView);
  } catch {
    // ignore — fall back to mock
  }
  return mockAuditForDeal(dealId);
}

function memoStatusToView(s: DbMemo["status"]): MockMemo["status"] {
  switch (s) {
    case "DRAFT":
      return "draft";
    case "REVIEW":
      return "review";
    case "FINAL":
      return "final";
    case "NEEDS_REVIEW":
      return "review";
  }
}

export async function findPipelineMemo(dealId: string): Promise<MockMemo | null> {
  try {
    const memo = await prisma.memo.findUnique({
      where: { dealId },
      include: { sections: { orderBy: { orderIdx: "asc" } } },
    });
    if (memo) return dbMemoToView(memo, dealId);
  } catch {
    // ignore — fall back to mock
  }
  if (dealId === memoHelios.dealId) return memoHelios;
  return null;
}

function dbMemoToView(memo: DbMemo & { sections: DbMemoSection[] }, dealId: string): MockMemo {
  return {
    dealId,
    status: memoStatusToView(memo.status),
    reviewProgress: num(memo.reviewProgress),
    pendingItems: memo.pendingItems ?? 0,
    lastEditedBy: memo.lastEditedById ?? "",
    lastEditedAt: (memo.lastEditedAt ?? memo.updatedAt).toISOString(),
    sections: memo.sections.map((s) => ({
      id: s.sectionKey,
      title: s.title,
      body: s.body,
      reviewed: s.reviewed,
    })),
  };
}

export async function findPipelineFinancialSnapshot(
  dealId: string,
): Promise<DbFinancialSnapshot | null> {
  try {
    return await prisma.financialSnapshot.findUnique({ where: { dealId } });
  } catch {
    return null;
  }
}

export async function getPipelineQuarterStats(): Promise<typeof mockQuarterStats> {
  try {
    const [leadsSourced, inDD, icReady, daysSavedAgg] = await Promise.all([
      prisma.lead.count(),
      prisma.deal.count({ where: { stage: "IN_DD" } }),
      prisma.deal.count({ where: { stage: "IC_READY" } }),
      prisma.deal.aggregate({ _sum: { timeSavedDays: true } }),
    ]);
    if (leadsSourced + inDD + icReady > 0) {
      return {
        leadsSourced,
        inDD,
        icReady,
        pipelineValue: mockQuarterStats.pipelineValue,
        daysSaved: num(daysSavedAgg._sum.timeSavedDays),
        qoqDelta: mockQuarterStats.qoqDelta,
      };
    }
  } catch {
    // ignore — fall back to mock
  }
  return mockQuarterStats;
}

export type { KanbanDeal, Stage, RedFlag, Question, AuditEntry, MockMemo as PipelineMemo };
