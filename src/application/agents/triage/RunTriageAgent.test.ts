import { describe, expect, it } from "vitest";
import { FakeAgentRunner } from "../../test-support/fakes";
import { makeRunTriageAgent } from "./RunTriageAgent";
import type { A1Input } from "./A1.prompt";
import type { A1Output } from "./A1.schema";
import type { AgentContext } from "../shared/agentTypes";

interface FakeAgentOutputRow {
  id: string;
  runId: string;
  agentId: string;
  status: string;
  output: object | null;
  promptHash: string | null;
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costCents: number | null;
  durationMs: number | null;
  errorJson: object | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

interface FakeDocumentRow {
  id: string;
  category: string | null;
  peTaxonomy: string[];
  dealRelevance: number | null;
  riskSignal: number | null;
  routedTo: string[];
  redflagKeywords: string[];
  status: string;
}

function makeFakePrisma() {
  const agentOutputRows: FakeAgentOutputRow[] = [];
  const documentRows = new Map<string, FakeDocumentRow>();

  documentRows.set("doc_1", {
    id: "doc_1",
    category: null,
    peTaxonomy: [],
    dealRelevance: null,
    riskSignal: null,
    routedTo: [],
    redflagKeywords: [],
    status: "UPLOADED",
  });

  let nextId = 1;
  const prisma = {
    agentOutput: {
      create: async ({ data }: { data: Partial<FakeAgentOutputRow> }) => {
        const row: FakeAgentOutputRow = {
          id: `ao_${nextId++}`,
          runId: data.runId!,
          agentId: data.agentId!,
          status: data.status ?? "running",
          output: data.output ?? null,
          promptHash: data.promptHash ?? null,
          model: data.model ?? null,
          tokensIn: data.tokensIn ?? null,
          tokensOut: data.tokensOut ?? null,
          costCents: data.costCents ?? null,
          durationMs: data.durationMs ?? null,
          errorJson: data.errorJson ?? null,
          startedAt: data.startedAt ?? null,
          completedAt: data.completedAt ?? null,
        };
        agentOutputRows.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FakeAgentOutputRow>;
      }) => {
        const row = agentOutputRows.find((r) => r.id === where.id);
        if (!row) throw new Error(`agentOutput ${where.id} not found`);
        Object.assign(row, data);
        return row;
      },
    },
    document: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FakeDocumentRow>;
      }) => {
        const row = documentRows.get(where.id);
        if (!row) throw new Error(`document ${where.id} not found`);
        Object.assign(row, data);
        return row;
      },
    },
  };

  return { prisma, agentOutputRows, documentRows };
}

const ctx: AgentContext = {
  runId: "run_1",
  dealId: "deal_1",
  leadId: "lead_1",
  ownerId: "user_1",
  thesisId: null,
  industry: null,
  geographies: [],
  fiscalYearEnd: "12-31",
  asOfDate: "2026-04-26",
  currency: "EUR",
};

const input: A1Input = {
  doc_id: "doc_1",
  filename: "Audited_Accounts_FY2024.pdf",
  vdr_folder: "Financial",
  head_text: "ANNUAL AUDIT 2024 ... Total revenue €31.0M ...",
  tail_text: "... no material weaknesses identified.",
  page_count: 156,
  byte_size: 4200,
};

const expectedOutput: A1Output = {
  doc_id: "doc_1",
  front_category: "FINANCIAL",
  pe_taxonomy: ["financial.audit"],
  deal_relevance: 5,
  risk_signal: 0,
  redflag_keywords_hit: [],
  route_to_agents: ["A2", "A3"],
  evidence: [],
};

describe("RunTriageAgent", () => {
  it("persists the running → success transition with usage and writes the document", async () => {
    const runner = new FakeAgentRunner();
    runner.setOutput("A1", expectedOutput);
    const { prisma, agentOutputRows, documentRows } = makeFakePrisma();

    const run = makeRunTriageAgent({ agentRunner: runner, prisma: prisma as never });
    const result = await run({ ctx, input });

    expect(result.output).toEqual(expectedOutput);

    expect(agentOutputRows).toHaveLength(1);
    expect(agentOutputRows[0]).toMatchObject({
      runId: "run_1",
      agentId: "A1",
      status: "success",
      output: expectedOutput,
      tokensIn: 100,
      tokensOut: 50,
      costCents: 1,
      promptHash: "fake-A1-hash",
    });

    expect(documentRows.get("doc_1")).toMatchObject({
      category: "FINANCIAL",
      peTaxonomy: ["financial.audit"],
      routedTo: ["A2", "A3"],
      status: "INDEXED",
    });

    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0].agentId).toBe("A1");
  });

  it("persists status=failed and re-throws when the runner fails", async () => {
    const runner = new FakeAgentRunner();
    runner.shouldThrow = new Error("LLM timeout");
    const { prisma, agentOutputRows, documentRows } = makeFakePrisma();

    const run = makeRunTriageAgent({ agentRunner: runner, prisma: prisma as never });

    await expect(run({ ctx, input })).rejects.toThrow("LLM timeout");

    expect(agentOutputRows).toHaveLength(1);
    expect(agentOutputRows[0].status).toBe("failed");
    expect(agentOutputRows[0].errorJson).toMatchObject({ message: "LLM timeout" });

    // Document is left untouched on failure
    expect(documentRows.get("doc_1")?.status).toBe("UPLOADED");
  });
});
