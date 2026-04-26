import type { PrismaClient } from "@prisma/client";
import type { AgentId } from "../../agents/shared/agentTypes";

const STAGE1: ReadonlyArray<AgentId> = ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"];

export type Stage1Outputs = {
  a2_output: unknown;
  a3_output: unknown;
  a4_output: unknown;
  a5_output: unknown;
  a6_output: unknown;
  a7_output: unknown;
  a8_output: unknown;
  a9_output: unknown;
};

export interface LoadStage1OutputsDeps {
  prisma: PrismaClient;
}

/**
 * Pull the latest successful AgentOutput for each stage-1 agent in a given
 * run. Failed agents resolve to null so S1/S2 can still proceed (with a
 * lower coverage).
 */
export async function loadStage1Outputs(
  deps: LoadStage1OutputsDeps,
  runId: string,
): Promise<Stage1Outputs> {
  const rows = await deps.prisma.agentOutput.findMany({
    where: { runId, status: "success", agentId: { in: [...STAGE1] } },
    select: { agentId: true, output: true },
  });
  const byAgent = new Map(rows.map((r) => [r.agentId, r.output]));
  return {
    a2_output: byAgent.get("A2") ?? null,
    a3_output: byAgent.get("A3") ?? null,
    a4_output: byAgent.get("A4") ?? null,
    a5_output: byAgent.get("A5") ?? null,
    a6_output: byAgent.get("A6") ?? null,
    a7_output: byAgent.get("A7") ?? null,
    a8_output: byAgent.get("A8") ?? null,
    a9_output: byAgent.get("A9") ?? null,
  };
}

export interface S1OutputRow {
  output: unknown;
}

export async function loadS1Output(deps: LoadStage1OutputsDeps, runId: string): Promise<unknown> {
  const row = await deps.prisma.agentOutput.findUnique({
    where: { runId_agentId: { runId, agentId: "S1" } },
    select: { output: true },
  });
  return row?.output ?? null;
}
