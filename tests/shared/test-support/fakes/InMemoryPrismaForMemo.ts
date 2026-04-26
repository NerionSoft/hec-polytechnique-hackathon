/**
 * In-memory Prisma stand-in for the memo / verifier normalizers.
 *
 * Covers: citation, finding, memo, memoSection, dDRun, dealAuditEvent.
 * Compatible surface with the Prisma client subset used by:
 *   - normalizeS1
 *   - normalizeS2
 *   - normalizeS3
 *   - shared findingNormalizer / displayId / upsertCitation
 */
type CitationRow = {
  id: string;
  displayId: string;
  dealId: string;
  documentId: string | null;
  chunkId: string | null;
  sectionRef: string | null;
  page: number | null;
  excerpt: string;
  confidence: string;
  verified: boolean;
  usedIn: string[];
};
type FindingRow = {
  id: string;
  displayId: string;
  dealId: string;
  agentId: string;
  externalId: string;
  category: string;
};
type MemoRow = {
  id: string;
  dealId: string;
  runId: string;
  status: string;
  reviewProgress: unknown;
  pendingItems: number | null;
};
type MemoSectionRow = {
  id: string;
  memoId: string;
  sectionKey: string;
  title: string;
  body: string;
  reviewed: boolean;
  orderIdx: number;
  citationIds: string[];
};
type DDRunRow = {
  id: string;
  dealId: string;
  status: string;
  citationPassRate: unknown;
};
type DealRow = {
  id: string;
  thesisFit: number | null;
  nextAction: string | null;
  coverage: unknown;
};
type AgentOutputRow = {
  id: string;
  runId: string;
  agentId: string;
  status: string;
};
type AuditEventRow = {
  id: string;
  dealId: string;
  kind: string;
  payload: unknown;
};

interface UpsertArgs {
  where: { dealId?: string; memoId_sectionKey?: { memoId: string; sectionKey: string } };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
  select?: unknown;
}

export class InMemoryPrismaForMemo {
  citations: CitationRow[] = [];
  findings: FindingRow[] = [];
  memos: MemoRow[] = [];
  memoSections: MemoSectionRow[] = [];
  ddRuns: DDRunRow[] = [];
  deals: DealRow[] = [];
  agentOutputs: AgentOutputRow[] = [];
  auditEvents: AuditEventRow[] = [];

  private nextId = 1;
  private id(prefix: string): string {
    return `${prefix}_${this.nextId++}`;
  }

  // displayId helper opens a transaction
  $transaction = async <T>(fn: (tx: this) => Promise<T>): Promise<T> => fn(this);

  citation = {
    findFirst: async ({
      where,
    }: {
      where: { dealId: string; chunkId: string | null; excerpt: string };
      select?: unknown;
    }) =>
      this.citations.find(
        (c) =>
          c.dealId === where.dealId && c.chunkId === where.chunkId && c.excerpt === where.excerpt,
      ) ?? null,
    findMany: async ({
      where,
      select,
    }: {
      where: { dealId: string };
      select?: { id?: true; displayId?: true; usedIn?: true };
    }) => {
      const rows = this.citations.filter((c) => c.dealId === where.dealId);
      if (!select) return rows;
      return rows.map((r) => {
        const projected: Record<string, unknown> = {};
        if (select.id) projected.id = r.id;
        if (select.displayId) projected.displayId = r.displayId;
        if (select.usedIn) projected.usedIn = r.usedIn;
        return projected;
      });
    },
    findUnique: async ({
      where,
      select,
    }: {
      where: { id: string };
      select?: { usedIn?: true };
    }) => {
      const row = this.citations.find((c) => c.id === where.id) ?? null;
      if (!row) return null;
      if (!select) return row;
      const projected: Record<string, unknown> = {};
      if (select.usedIn) projected.usedIn = row.usedIn;
      return projected;
    },
    create: async ({
      data,
    }: {
      data: Omit<CitationRow, "id"> & { id?: string };
      select?: unknown;
    }) => {
      const row: CitationRow = { id: this.id("cit"), ...data };
      this.citations.push(row);
      return row;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<CitationRow> }) => {
      const row = this.citations.find((c) => c.id === where.id);
      if (!row) throw new Error(`citation ${where.id} not found`);
      Object.assign(row, data);
      return row;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: {
        dealId: string;
        verified?: boolean;
        displayId?: { notIn: string[] };
      };
      data: Partial<CitationRow>;
    }) => {
      let n = 0;
      for (const c of this.citations) {
        if (c.dealId !== where.dealId) continue;
        if (where.verified !== undefined && c.verified !== where.verified) continue;
        if (where.displayId?.notIn && where.displayId.notIn.includes(c.displayId)) continue;
        Object.assign(c, data);
        n++;
      }
      return { count: n };
    },
  };

  finding = {
    findMany: async ({
      where,
      select,
    }: {
      where: { dealId: string };
      select?: { id?: true; displayId?: true };
    }) => {
      const rows = this.findings.filter((f) => f.dealId === where.dealId);
      if (!select) return rows;
      return rows.map((r) => {
        const projected: Record<string, unknown> = {};
        if (select.id) projected.id = r.id;
        if (select.displayId) projected.displayId = r.displayId;
        return projected;
      });
    },
  };

  memo = {
    upsert: async (args: UpsertArgs) => {
      const dealId = args.where.dealId!;
      const existing = this.memos.find((m) => m.dealId === dealId);
      if (existing) {
        Object.assign(existing, args.update);
        return { id: existing.id };
      }
      const row: MemoRow = {
        id: this.id("memo"),
        ...(args.create as Omit<MemoRow, "id">),
        dealId,
      } as MemoRow;
      this.memos.push(row);
      return { id: row.id };
    },
    update: async ({ where, data }: { where: { dealId: string }; data: Partial<MemoRow> }) => {
      const row = this.memos.find((m) => m.dealId === where.dealId);
      if (!row) throw new Error(`memo for deal ${where.dealId} not found`);
      Object.assign(row, data);
      return row;
    },
  };

  memoSection = {
    upsert: async (args: UpsertArgs) => {
      const key = args.where.memoId_sectionKey!;
      const existing = this.memoSections.find(
        (s) => s.memoId === key.memoId && s.sectionKey === key.sectionKey,
      );
      const citationConnects = this.extractConnects(
        (args.update.citations as { set?: { id: string }[] })?.set ??
          (args.create.citations as { connect?: { id: string }[] })?.connect ??
          [],
      );
      if (existing) {
        Object.assign(existing, args.update, { citationIds: citationConnects });
        return { id: existing.id };
      }
      const row: MemoSectionRow = {
        id: this.id("sec"),
        memoId: key.memoId,
        sectionKey: key.sectionKey,
        title: args.create.title as string,
        body: args.create.body as string,
        reviewed: (args.create.reviewed as boolean) ?? false,
        orderIdx: args.create.orderIdx as number,
        citationIds: citationConnects,
      };
      this.memoSections.push(row);
      return { id: row.id };
    },
  };

  dDRun = {
    update: async ({ where, data }: { where: { id: string }; data: Partial<DDRunRow> }) => {
      const row = this.ddRuns.find((r) => r.id === where.id);
      if (!row) throw new Error(`run ${where.id} not found`);
      Object.assign(row, data);
      return row;
    },
  };

  deal = {
    update: async ({ where, data }: { where: { id: string }; data: Partial<DealRow> }) => {
      const row = this.deals.find((d) => d.id === where.id);
      if (!row) throw new Error(`deal ${where.id} not found`);
      Object.assign(row, data);
      return row;
    },
  };

  agentOutput = {
    count: async ({
      where,
    }: {
      where: { runId: string; status: string; agentId: { in: string[] } };
    }) =>
      this.agentOutputs.filter(
        (a) =>
          a.runId === where.runId &&
          a.status === where.status &&
          where.agentId.in.includes(a.agentId),
      ).length,
  };

  dealAuditEvent = {
    create: async ({ data }: { data: Omit<AuditEventRow, "id"> & { id?: string } }) => {
      const row: AuditEventRow = { id: this.id("aud"), ...data };
      this.auditEvents.push(row);
      return row;
    },
  };

  // Test helpers
  seedDeal(id: string): void {
    this.deals.push({ id, thesisFit: null, nextAction: null, coverage: null });
  }
  seedRun(id: string, dealId: string): void {
    this.ddRuns.push({
      id,
      dealId,
      status: "RUNNING",
      citationPassRate: null,
    });
  }
  seedAgentOutput(runId: string, agentId: string, status: string): void {
    this.agentOutputs.push({
      id: this.id("ao"),
      runId,
      agentId,
      status,
    });
  }
  seedFinding(opts: {
    dealId: string;
    displayId: string;
    agentId?: string;
    externalId?: string;
    category?: string;
  }): FindingRow {
    const row: FindingRow = {
      id: this.id("find"),
      dealId: opts.dealId,
      displayId: opts.displayId,
      agentId: opts.agentId ?? "A3",
      externalId: opts.externalId ?? "EX-1",
      category: opts.category ?? "FINANCIAL",
    };
    this.findings.push(row);
    return row;
  }
  seedCitation(opts: {
    dealId: string;
    displayId: string;
    chunkId: string | null;
    excerpt: string;
    page?: number | null;
  }): CitationRow {
    const row: CitationRow = {
      id: this.id("cit"),
      dealId: opts.dealId,
      displayId: opts.displayId,
      documentId: null,
      chunkId: opts.chunkId,
      sectionRef: null,
      page: opts.page ?? null,
      excerpt: opts.excerpt,
      confidence: "MEDIUM",
      verified: false,
      usedIn: [],
    };
    this.citations.push(row);
    return row;
  }

  private extractConnects(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input
      .map((c) =>
        typeof c === "object" && c !== null ? ((c as { id?: string }).id ?? null) : null,
      )
      .filter((id): id is string => Boolean(id));
  }
}
