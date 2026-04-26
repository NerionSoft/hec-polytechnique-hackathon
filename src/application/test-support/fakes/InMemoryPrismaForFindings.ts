/**
 * Tiny in-memory Prisma stand-in covering ONLY the surface area used by
 * the findings normalizer + its dependencies (citation upsert, displayId).
 *
 * Intentionally minimal — no schema validation, no relations enforcement,
 * just enough to make `normalizeFindings` exercise its logic in unit tests.
 */
type Citation = {
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

type Finding = {
  id: string;
  displayId: string;
  dealId: string;
  runId: string;
  agentId: string;
  externalId: string;
  severity: string;
  category: string;
  title: string;
  summary: string | null;
  detail: string | null;
  confidence: string;
  impact: string | null;
  status: string;
  primaryCitationId: string | null;
  suggestedQuestion: string | null;
  exposureEur: unknown;
  raisedBy: string;
  citationIds: string[]; // many-to-many links
};

type ManagementQuestion = {
  id: string;
  displayId: string;
  dealId: string;
  runId: string;
  topic: string;
  body: string;
  derivedFromFindingId: string | null;
  status: string;
  raisedBy: string;
};

export class InMemoryPrismaForFindings {
  citations: Citation[] = [];
  findings: Finding[] = [];
  questions: ManagementQuestion[] = [];

  private nextId = 1;
  private id(prefix: string): string {
    return `${prefix}_${this.nextId++}`;
  }

  // The shared displayId helper opens a transaction. We faithfully emulate
  // that surface — the callback receives `this` and resolves with its result.
  $transaction = async <T>(fn: (tx: this) => Promise<T>): Promise<T> => fn(this);

  citation = {
    findFirst: async ({
      where,
    }: {
      where: { dealId: string; chunkId: string | null; excerpt: string };
      select?: unknown;
    }) => {
      const found = this.citations.find(
        (c) =>
          c.dealId === where.dealId && c.chunkId === where.chunkId && c.excerpt === where.excerpt,
      );
      return found ?? null;
    },
    findMany: async ({ where }: { where: { dealId: string }; select?: unknown }) =>
      this.citations.filter((c) => c.dealId === where.dealId),
    create: async ({
      data,
    }: {
      data: Omit<Citation, "id"> & { id?: string };
      select?: unknown;
    }) => {
      const row: Citation = { id: this.id("cit"), ...data } as Citation;
      this.citations.push(row);
      return row;
    },
  };

  finding = {
    findMany: async ({ where }: { where: { dealId: string }; select?: unknown }) =>
      this.findings.filter((f) => f.dealId === where.dealId),
    create: async ({
      data,
    }: {
      data: Omit<Finding, "id" | "citationIds" | "status"> & {
        status?: string;
        citations?: { connect: { id: string }[] };
      };
    }) => {
      const citationIds = data.citations?.connect?.map((c) => c.id) ?? [];
      const row: Finding = {
        id: this.id("find"),
        status: data.status ?? "PENDING_REVIEW",
        citationIds,
        ...data,
      } as Finding;
      this.findings.push(row);
      return row;
    },
  };

  managementQuestion = {
    findMany: async ({ where }: { where: { dealId: string }; select?: unknown }) =>
      this.questions.filter((q) => q.dealId === where.dealId),
    create: async ({
      data,
    }: {
      data: Omit<ManagementQuestion, "id" | "status"> & { status?: string };
    }) => {
      const row: ManagementQuestion = {
        id: this.id("mmq"),
        status: data.status ?? "PENDING_REVIEW",
        ...data,
      };
      this.questions.push(row);
      return row;
    },
  };
}
