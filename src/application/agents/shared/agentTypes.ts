/**
 * Shared types for the Athena DD agent pipeline.
 * Mirrors the AgentContext defined in docs/agents/orchestrator.md.
 */

export type AgentId =
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "A5"
  | "A6"
  | "A7"
  | "A8"
  | "A9"
  | "S1"
  | "S2"
  | "S3";

export interface AgentContext {
  runId: string;
  dealId: string;
  leadId: string;
  ownerId: string;
  thesisId: string | null;
  industry: string | null;
  geographies: string[];
  fiscalYearEnd: string;
  asOfDate: string;
  currency: "EUR" | "USD";
}

export interface AgentUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  costCents: number | null;
}

export interface AgentRunResult<T> {
  agentId: AgentId;
  output: T;
  usage: AgentUsage;
  durationMs: number;
  promptHash: string;
  model: string;
}
