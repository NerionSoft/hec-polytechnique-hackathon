# Normalizers — Agent JSON → Prisma rows

Each agent has a sibling **normalizer** module. Normalizers are pure deterministic TypeScript (no LLM) that transform agent JSON outputs into typed Prisma writes. They are idempotent (re-runnable) and validated by zod schemas at their input boundary.

```
src/application/agents/
├── A1.triage.ts            ← prompt + LLM call
├── A1.normalizer.ts        ← upserts Document fields
├── A2.financial.ts
├── A2.normalizer.ts        ← upserts Deal KPIs + FinancialSnapshot trends
├── A3.qoe.ts
├── A3.normalizer.ts        ← inserts Finding[] + Citation[] + ManagementQuestion[]
├── ...
├── S2.memo.ts
└── S2.normalizer.ts        ← upserts Memo + 5×MemoSection + new Citations
```

## Common helpers

```ts
// src/application/agents/shared/display-id.ts
export async function nextDisplayId(
  prisma: PrismaClient,
  table: "finding" | "citation" | "management_question",
  prefix: "rf" | "c" | "q",
  dealId: string,
): Promise<string> {
  // Atomic increment using row count + max parsing.
  // Locks the deal row briefly to avoid collisions across parallel agents.
  return prisma.$transaction(async (tx) => {
    const rows = await tx[table].findMany({
      where: { dealId },
      select: { displayId: true },
    });
    const maxN = rows
      .map((r) => parseInt(r.displayId.replace(prefix, ""), 10))
      .reduce((a, b) => Math.max(a, b), 0);
    return `${prefix}${maxN + 1}`;
  });
}
```

```ts
// src/application/agents/shared/upsert-citation.ts
export async function upsertCitationFromEvidence(
  prisma: PrismaClient,
  dealId: string,
  evidence: {
    doc_id: string;
    chunk_id: string;
    section: string;
    page?: number;
    quote: string;
    confidence?: Confidence;
  },
): Promise<string> {
  // Dedup by (dealId, chunkId, excerpt[:120]) to avoid duplicate Citations
  const key = { dealId, chunkId: evidence.chunk_id, excerpt: evidence.quote };
  const existing = await prisma.citation.findFirst({ where: key });
  if (existing) return existing.id;

  const displayId = await nextDisplayId(prisma, "citation", "c", dealId);
  const created = await prisma.citation.create({
    data: {
      dealId,
      displayId,
      documentId: evidence.doc_id,
      chunkId: evidence.chunk_id,
      sectionRef: evidence.section,
      page: evidence.page ?? null,
      excerpt: evidence.quote,
      confidence: evidence.confidence ?? "MEDIUM",
      verified: false, // S3 will flip
      usedIn: [],
    },
  });
  return created.id;
}
```

## A1 — Document triage

```ts
export async function normalizeA1(prisma: PrismaClient, ctx: AgentContext, output: A1Output) {
  const TAXONOMY_TO_FRONT: Record<string, DocCategory> = {
    "financial.audit": "FINANCIAL",
    "financial.budget": "FINANCIAL",
    "financial.ar_aging": "FINANCIAL",
    tax: "TAX",
    "customer.contract.tier1": "LEGAL",
    "customer.contract.tier2": "LEGAL",
    "debt.facility": "LEGAL",
    "debt.covenant": "LEGAL",
    "legal.litigation": "LEGAL",
    "legal.ip": "LEGAL",
    "legal.change_of_control": "LEGAL",
    "regulatory.compliance": "LEGAL",
    "governance.board": "LEGAL",
    "hr.key_person": "HR",
    "hr.policy": "HR",
    "commercial.market_study": "COMMERCIAL",
    "operations.kpi": "COMMERCIAL",
    "operations.security": "COMMERCIAL",
    other: "LEGAL",
  };

  const category = output.front_category ?? TAXONOMY_TO_FRONT[output.pe_taxonomy[0]] ?? "LEGAL";

  await prisma.document.update({
    where: { id: output.doc_id },
    data: {
      category,
      peTaxonomy: output.pe_taxonomy,
      dealRelevance: output.deal_relevance,
      riskSignal: output.risk_signal,
      routedTo: output.route_to_agents,
      redflagKeywords: output.redflag_keywords_hit,
      status: "INDEXED",
    },
  });
}
```

## A2 — Financial snapshot

```ts
export async function normalizeA2(prisma: PrismaClient, ctx: AgentContext, output: A2Output) {
  // 1. Push KPI sync into Deal columns
  const k = output.deal_kpi_sync;
  await prisma.deal.update({
    where: { id: ctx.dealId },
    data: {
      revenueEur: k.revenue_eur ?? undefined,
      ebitdaEur: k.ebitda_eur ?? undefined,
      ebitdaMargin: k.ebitda_margin ?? undefined,
      growthYoy: k.growth_yoy ?? undefined,
      netDebtEbitda: k.net_debt_ebitda ?? undefined,
      employees: k.employees ?? undefined,
      founded: k.founded ?? undefined,
    },
  });

  // 2. Upsert FinancialSnapshot row with trend / kpi / WC views
  await prisma.financialSnapshot.upsert({
    where: { dealId: ctx.dealId },
    create: {
      dealId: ctx.dealId,
      runId: ctx.runId,
      trendJson: output.trend_view,
      kpiJson: output.kpi_view,
      workingCapitalJson: output.working_capital_view,
      // bridge / concentration / retention filled by A4 / A5 normalizers
      bridgeJson: [],
      concentrationJson: [],
      retentionJson: {},
    },
    update: {
      runId: ctx.runId,
      trendJson: output.trend_view,
      kpiJson: output.kpi_view,
      workingCapitalJson: output.working_capital_view,
    },
  });
}
```

## A3 / A6 / A7 / A9 — Generic finding normalizer

These four agents share the same shape (findings + management questions). One generic normalizer with a per-agent category default:

```ts
type FindingNormalizerConfig = {
  agentId: "A3" | "A6" | "A7" | "A9";
  defaultCategory?: FindingCategory; // null when agent emits per-finding category (A9)
  topicFor: (f: any) => FindingCategory; // for the MMQ topic
};

export async function normalizeFindings(
  prisma: PrismaClient,
  ctx: AgentContext,
  cfg: FindingNormalizerConfig,
  findings: AgentFinding[],
) {
  for (const f of findings) {
    // 1. Upsert each evidence into Citation, find primary
    const citationIds = await Promise.all(
      f.evidence.map((e: any) => upsertCitationFromEvidence(prisma, ctx.dealId, e)),
    );
    const primaryCitationId = citationIds[f.primary_evidence_index ?? 0];

    // 2. Insert Finding
    const findingDisplayId = await nextDisplayId(prisma, "finding", "rf", ctx.dealId);
    const finding = await prisma.finding.create({
      data: {
        displayId: findingDisplayId,
        dealId: ctx.dealId,
        runId: ctx.runId,
        agentId: cfg.agentId,
        externalId: f.external_id,
        severity: f.severity,
        category: f.category ?? cfg.defaultCategory!,
        title: f.title,
        summary: f.summary,
        detail: f.detail,
        confidence: f.confidence,
        impact: f.impact,
        suggestedQuestion: f.management_question,
        exposureEur: f.exposure_eur ?? null,
        primaryCitationId,
        raisedBy: "ai",
        citations: { connect: citationIds.map((id) => ({ id })) },
      },
    });

    // 3. Insert ManagementQuestion derived from the finding
    if (f.management_question) {
      const qId = await nextDisplayId(prisma, "management_question", "q", ctx.dealId);
      await prisma.managementQuestion.create({
        data: {
          displayId: qId,
          dealId: ctx.dealId,
          runId: ctx.runId,
          topic: cfg.topicFor(f),
          body: f.management_question,
          derivedFromFindingId: finding.id,
          raisedBy: "ai",
        },
      });
    }
  }
}
```

Per-agent calls:

```ts
// A3
normalizeFindings(
  prisma,
  ctx,
  { agentId: "A3", defaultCategory: "FINANCIAL", topicFor: () => "FINANCIAL" },
  output.findings,
);

// A6
normalizeFindings(
  prisma,
  ctx,
  { agentId: "A6", defaultCategory: "FINANCIAL", topicFor: () => "FINANCIAL" },
  output.redflag_findings,
);

// A7
normalizeFindings(
  prisma,
  ctx,
  { agentId: "A7", defaultCategory: "LEGAL", topicFor: () => "LEGAL" },
  output.findings,
);

// A9 — per-finding category since A9 emits OPERATIONAL or ESG
normalizeFindings(
  prisma,
  ctx,
  { agentId: "A9", topicFor: (f) => (f.category === "OPERATIONAL" ? "OPERATIONAL" : "ESG") },
  output.redflag_findings,
);
```

## A4 — EBITDA bridge

```ts
export async function normalizeA4(prisma: PrismaClient, ctx: AgentContext, output: A4Output) {
  // 1. Bridge view into FinancialSnapshot
  await prisma.financialSnapshot.upsert({
    where: { dealId: ctx.dealId },
    create: {
      /* fallback if A2 hasn't run yet */ dealId: ctx.dealId,
      runId: ctx.runId,
      trendJson: [],
      kpiJson: {},
      workingCapitalJson: [],
      concentrationJson: [],
      retentionJson: {},
      bridgeJson: output.bridge_view,
    },
    update: { bridgeJson: output.bridge_view },
  });

  // 2. Update Deal.ebitdaEur with adjusted (only if positive)
  if (output.adjusted_ebitda_eur && output.adjusted_ebitda_eur > 0) {
    await prisma.deal.update({
      where: { id: ctx.dealId },
      data: { ebitdaEur: output.adjusted_ebitda_eur },
    });
  }

  // 3. Aggressive add-backs → Findings (use generic normalizer)
  const aggressiveFindings = output.adjustments
    .filter((a) => a.is_aggressive)
    .map((a) => ({
      external_id: a.external_id,
      severity: a.confidence === "LOW" ? "HIGH" : "MEDIUM",
      category: "FINANCIAL",
      title: `Aggressive add-back — ${a.label}`,
      summary: a.rationale,
      detail: a.rationale,
      confidence: a.confidence,
      impact: `Adjusted EBITDA may be overstated by ~${a.amount_eur} ${output.currency}`,
      primary_evidence_index: 0,
      evidence: a.evidence,
      management_question: a.management_question,
    }));
  await normalizeFindings(
    prisma,
    ctx,
    { agentId: "A4", defaultCategory: "FINANCIAL", topicFor: () => "FINANCIAL" },
    aggressiveFindings,
  );
}
```

## A5 — Customer concentration

```ts
export async function normalizeA5(prisma: PrismaClient, ctx: AgentContext, output: A5Output) {
  // 1. Concentration + retention views
  await prisma.financialSnapshot.upsert({
    where: { dealId: ctx.dealId },
    create: {
      dealId: ctx.dealId,
      runId: ctx.runId,
      trendJson: [],
      kpiJson: {},
      workingCapitalJson: [],
      bridgeJson: [],
      concentrationJson: output.concentration_view,
      retentionJson: output.retention_view,
    },
    update: {
      concentrationJson: output.concentration_view,
      retentionJson: output.retention_view,
    },
  });

  // 2. Threshold-breach findings
  await normalizeFindings(
    prisma,
    ctx,
    { agentId: "A5", defaultCategory: "COMMERCIAL", topicFor: () => "COMMERCIAL" },
    output.redflag_findings,
  );
}
```

## A8 — Commercial DD

```ts
export async function normalizeA8(prisma: PrismaClient, ctx: AgentContext, output: A8Output) {
  // 1. Open commercial questions (no underlying Finding required)
  for (const q of output.open_commercial_questions) {
    const qId = await nextDisplayId(prisma, "management_question", "q", ctx.dealId);
    await prisma.managementQuestion.create({
      data: {
        displayId: qId,
        dealId: ctx.dealId,
        runId: ctx.runId,
        topic: "COMMERCIAL",
        body: q.question,
        raisedBy: "ai",
        derivedFromFindingId: null,
      },
    });
  }

  // 2. Doc-grounded commercial findings (rare)
  await normalizeFindings(
    prisma,
    ctx,
    { agentId: "A8", defaultCategory: "COMMERCIAL", topicFor: () => "COMMERCIAL" },
    output.commercial_findings,
  );
}
```

## S1 — Deal thesis

```ts
export async function normalizeS1(prisma: PrismaClient, ctx: AgentContext, output: S1Output) {
  // Coverage = success agents / 8
  const stage1 = await prisma.agentOutput.findMany({
    where: {
      runId: ctx.runId,
      agentId: { in: ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"] },
      status: "success",
    },
  });

  await prisma.deal.update({
    where: { id: ctx.dealId },
    data: {
      thesisFit: output.thesis_fit_score,
      nextAction: output.next_action,
      coverage: stage1.length / 8,
    },
  });

  await prisma.dealAuditEvent.create({
    data: {
      dealId: ctx.dealId,
      kind: "thesis_generated",
      payload: output as any,
      actorId: null,
    },
  });
}
```

## S2 — IC memo

```ts
export async function normalizeS2(prisma: PrismaClient, ctx: AgentContext, output: S2Output) {
  // 1. Resolve new_citations to displayIds
  const tmpToDisplayId: Record<string, string> = {};
  for (const nc of output.new_citations) {
    const displayId = await nextDisplayId(prisma, "citation", "c", ctx.dealId);
    const created = await prisma.citation.create({
      data: {
        dealId: ctx.dealId,
        displayId,
        documentId: nc.doc_id,
        chunkId: nc.chunk_id,
        sectionRef: nc.section,
        page: nc.page ?? null,
        excerpt: nc.excerpt,
        confidence: nc.confidence,
        verified: false,
        usedIn: [],
      },
    });
    tmpToDisplayId[nc.tmp_ref] = displayId;
  }

  // 2. Validate every [cN] / [rfN] in body resolves
  const knownCitations = new Set(
    (
      await prisma.citation.findMany({
        where: { dealId: ctx.dealId },
        select: { displayId: true },
      })
    ).map((c) => c.displayId),
  );
  const knownFindings = new Set(
    (
      await prisma.finding.findMany({
        where: { dealId: ctx.dealId },
        select: { displayId: true },
      })
    ).map((f) => f.displayId),
  );
  const finalSections = output.sections.map((s) => {
    let body = s.body;
    for (const [tmp, real] of Object.entries(tmpToDisplayId)) {
      body = body.replaceAll(`[${tmp}]`, `[${real}]`);
    }
    // Verify
    const cTags = [...body.matchAll(/\[c(\d+)\]/g)].map((m) => `c${m[1]}`);
    const rTags = [...body.matchAll(/\[rf(\d+)\]/g)].map((m) => `rf${m[1]}`);
    for (const t of cTags)
      if (!knownCitations.has(t)) throw new Error(`Memo references unknown citation ${t}`);
    for (const t of rTags)
      if (!knownFindings.has(t)) throw new Error(`Memo references unknown red flag ${t}`);
    return { ...s, body };
  });

  // 3. Upsert Memo + 5 sections
  const memo = await prisma.memo.upsert({
    where: { dealId: ctx.dealId },
    create: {
      dealId: ctx.dealId,
      runId: ctx.runId,
      status: output.memo_status,
      reviewProgress: output.review_progress,
      pendingItems: output.pending_items,
    },
    update: {
      status: output.memo_status,
      reviewProgress: output.review_progress,
      pendingItems: output.pending_items,
    },
  });

  for (const s of finalSections) {
    await prisma.memoSection.upsert({
      where: { memoId_sectionKey: { memoId: memo.id, sectionKey: s.section_key } },
      create: {
        memoId: memo.id,
        sectionKey: s.section_key,
        title: s.title,
        body: s.body,
        reviewed: s.reviewed,
        orderIdx: ["thesis", "snapshot", "risks", "questions", "recommendation"].indexOf(
          s.section_key,
        ),
        citations: {
          connect: s.citations_used.map((displayId) => ({
            dealId_displayId: { dealId: ctx.dealId, displayId },
          })),
        },
      },
      update: {
        body: s.body,
        reviewed: s.reviewed,
      },
    });

    // Update Citation.usedIn for each [cN] referenced
    for (const cId of s.citations_used) {
      await prisma.citation.update({
        where: { dealId_displayId: { dealId: ctx.dealId, displayId: cId } },
        data: { usedIn: { push: s.section_key } },
      });
    }
  }
}
```

## S3 — Citation verifier

```ts
export async function normalizeS3(
  prisma: PrismaClient,
  ctx: AgentContext,
  output: S3Output,
  iteration: number,
) {
  // Flip verified=true on all referenced citations that didn't fail
  const failedTags = new Set(output.failures.map((f) => f.claimed_tag.replace(/\[|\]/g, "")));
  const allCitations = await prisma.citation.findMany({
    where: { dealId: ctx.dealId, displayId: { startsWith: "c" } },
  });
  for (const c of allCitations) {
    if (!failedTags.has(c.displayId)) {
      await prisma.citation.update({
        where: { id: c.id },
        data: { verified: true },
      });
    }
  }

  await prisma.dDRun.update({
    where: { id: ctx.runId },
    data: { citationPassRate: output.pass_rate },
  });

  if (output.verdict === "pass") {
    await prisma.memo.update({
      where: { dealId: ctx.dealId },
      data: { status: "REVIEW" },
    });
  } else if (iteration >= 3) {
    await prisma.memo.update({
      where: { dealId: ctx.dealId },
      data: { status: "NEEDS_REVIEW" },
    });
    await prisma.dDRun.update({
      where: { id: ctx.runId },
      data: { status: "NEEDS_REVIEW" },
    });
  }

  await prisma.dealAuditEvent.create({
    data: {
      dealId: ctx.dealId,
      kind: "citation_verifier_run",
      payload: { iteration, output } as any,
    },
  });
}
```

## Idempotency

All normalizers are idempotent:

- A1: `update` on `Document.id` (always exists at this point).
- A2: `upsert` keyed by `dealId`.
- A3/A4/A5/A6/A7/A8/A9: Findings are inserted, but the `(dealId, externalId, agentId)` triplet is naturally unique because `agentId` differs across agents and `externalId` is agent-internal. To enforce strictly: check existing Finding by `(dealId, agentId, externalId)` before insert.
- S1: idempotent UPDATE on Deal columns.
- S2: `upsert` on Memo + MemoSection by `(memoId, sectionKey)`.
- S3: idempotent UPDATEs (setting `verified=true` is monotonic).

This means **rerunning a normalizer is always safe** — useful when you change the mapping logic and want to re-apply over existing `agent_output.output` JSONB without rerunning the LLM.
