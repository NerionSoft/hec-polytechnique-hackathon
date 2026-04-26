# Generic Agent Runner — Gemini 3 implementation

The runner is the only piece that touches the LLM SDK. Every agent (A1..S3) goes through it. Per-agent specifics are configuration entries, not code.

## SDK & env

```bash
pnpm add @google/genai zod
```

`.env`:

```
GOOGLE_API_KEY=AIza...     # Gemini API key
```

`@google/genai` is the official Google SDK that supports Gemini 3 (replaces the legacy `@google/generative-ai`).

## Why Gemini 3 changes the runner shape

- **No tool-use plumbing**: structured output is enforced via `responseMimeType: "application/json"` + `responseSchema`. The model literally cannot return malformed JSON.
- **Native Caches API**: the citation contract + system prompt is registered once per agent (per session) and reused — applies to the 966 A1 invocations and the 8 stage-1 specialists.
- **Thinking budget**: Pro variants accept a `thinkingBudget` (extra reasoning tokens) for the heavy agents (A3/A7/S1/S2).
- **Files API**: not used here — we keep retrieval client-side over chunks; Gemini sees only the relevant chunks per call (cheaper, traceable for citations).

## Files

```
src/application/agents/
├── shared/
│   ├── gemini-client.ts        # singleton GoogleGenAI client
│   ├── cache-manager.ts        # creates/refreshes per-agent Caches
│   ├── citation-contract.ts    # 00_citation_contract.md → string export
│   ├── registry.ts             # AGENT_CONFIG[agentId]
│   ├── schemas.ts              # zod + Gemini Type schemas per agent
│   ├── retrieval.ts            # hybrid BM25+pgvector → relevant chunks
│   └── run-agent.ts            # the universal runner
├── A1.triage.ts                # only the system prompt + schema
├── A2.financial.ts
└── ...
```

## `gemini-client.ts`

```ts
import { GoogleGenAI } from "@google/genai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is required for the agent runner");
}

export const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
```

## `registry.ts` — per-agent config

```ts
import { Type } from "@google/genai";
import { z } from "zod";
import * as schemas from "./schemas";

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

export type AgentConfig = {
  agentId: AgentId;
  model: string; // 'gemini-3-pro' | 'gemini-3-flash'
  systemPrompt: string; // raw system instruction
  responseSchema: object; // Gemini schema (Type.OBJECT...)
  zodSchema: z.ZodTypeAny; // runtime validation safety net
  temperature: number;
  maxOutputTokens: number;
  thinkingBudget?: number; // Pro only
  retrievalTags: string[]; // Document.peTaxonomy filter
  retrievalK: number; // top-K chunks to feed
};

export const AGENT_CONFIG: Record<AgentId, AgentConfig> = {
  A1: {
    agentId: "A1",
    model: "gemini-3-flash",
    systemPrompt: schemas.A1_SYSTEM_PROMPT,
    responseSchema: schemas.A1_SCHEMA,
    zodSchema: schemas.A1ZodSchema,
    temperature: 0.1,
    maxOutputTokens: 1024,
    retrievalTags: [], // A1 sees only the doc itself
    retrievalK: 0,
  },
  A2: {
    agentId: "A2",
    model: "gemini-3-flash",
    systemPrompt: schemas.A2_SYSTEM_PROMPT,
    responseSchema: schemas.A2_SCHEMA,
    zodSchema: schemas.A2ZodSchema,
    temperature: 0,
    maxOutputTokens: 8192,
    retrievalTags: ["financial.audit", "financial.budget", "financial.ar_aging", "operations.kpi"],
    retrievalK: 30,
  },
  A3: {
    agentId: "A3",
    model: "gemini-3-pro",
    systemPrompt: schemas.A3_SYSTEM_PROMPT,
    responseSchema: schemas.A3_SCHEMA,
    zodSchema: schemas.A3ZodSchema,
    temperature: 0.2,
    maxOutputTokens: 16384,
    thinkingBudget: 8192,
    retrievalTags: [
      "financial.audit",
      "financial.ar_aging",
      "financial.budget",
      "customer.contract.tier1",
      "customer.contract.tier2",
      "governance.board",
      "tax",
    ],
    retrievalK: 50,
  },
  // ... A4..A9, S1..S3 same shape
};
```

## `cache-manager.ts` — Gemini Caches API

```ts
import { genai } from "./gemini-client";
import { citationContract } from "./citation-contract";
import { AGENT_CONFIG, type AgentId } from "./registry";

// In-memory map: agentId → cache name. Recreated per pipeline run because
// caches have a TTL and only apply to a single deal's docs anyway.
const cacheNames = new Map<AgentId, string>();

export async function getOrCreateCache(agentId: AgentId): Promise<string | undefined> {
  if (cacheNames.has(agentId)) return cacheNames.get(agentId);

  const cfg = AGENT_CONFIG[agentId];
  // Caches require a minimum content size (~32k tokens for Pro, ~1k for Flash).
  // Citation contract + system prompt is ~2k tokens — only worth caching for
  // the agents we'll call >5 times. A1 is a clear yes (966 calls).
  // For others, skip caching (the savings don't outweigh the setup cost).
  if (agentId !== "A1") return undefined;

  const cache = await genai.caches.create({
    model: cfg.model,
    config: {
      contents: [{ role: "user", parts: [{ text: citationContract + "\n\n" + cfg.systemPrompt }] }],
      ttl: "3600s",
    },
  });
  cacheNames.set(agentId, cache.name);
  return cache.name;
}

export function clearCache() {
  cacheNames.clear();
}
```

## `run-agent.ts` — the universal runner

```ts
import { genai } from "./gemini-client";
import { AGENT_CONFIG, type AgentId } from "./registry";
import { getOrCreateCache } from "./cache-manager";
import { citationContract } from "./citation-contract";
import { retrieveForAgent } from "./retrieval";
import { prisma } from "@/src/infrastructure/db/client";
import { sha256 } from "node:crypto";
import type { AgentContext } from "@/src/application/orchestration/context";

export async function runAgent<T = unknown>(
  agentId: AgentId,
  ctx: AgentContext,
  input: Record<string, unknown> = {},
): Promise<T> {
  const cfg = AGENT_CONFIG[agentId];
  const startedAt = Date.now();

  // 1. Retrieval — pick the relevant chunks
  const chunks = await retrieveForAgent(agentId, ctx, cfg, input);

  // 2. Build the user message
  const userMessage = buildUserMessage({ ctx, input, chunks });
  const promptHash = sha256(JSON.stringify({ agentId, userMessage })).digest("hex");

  // 3. Persist a 'running' row (audit trail starts here)
  const ao = await prisma.agentOutput.create({
    data: {
      runId: ctx.runId,
      agentId,
      status: "running",
      promptHash,
      model: cfg.model,
      startedAt: new Date(),
    },
  });

  try {
    // 4. Call Gemini with cached system prompt OR inline system instruction
    const cachedContent = await getOrCreateCache(agentId);

    const response = await genai.models.generateContent({
      model: cfg.model,
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        // If cached: don't repeat systemInstruction (it's in the cache)
        ...(cachedContent
          ? { cachedContent }
          : { systemInstruction: citationContract + "\n\n" + cfg.systemPrompt }),
        responseMimeType: "application/json",
        responseSchema: cfg.responseSchema,
        temperature: cfg.temperature,
        maxOutputTokens: cfg.maxOutputTokens,
        ...(cfg.thinkingBudget ? { thinkingConfig: { thinkingBudget: cfg.thinkingBudget } } : {}),
      },
    });

    // 5. Parse + validate (schema is enforced server-side, zod is belt-and-braces)
    const text = response.text;
    if (!text) throw new Error(`${agentId} returned no text`);
    const raw = JSON.parse(text);
    const parsed = cfg.zodSchema.parse(raw);

    // 6. Persist the success row
    const usage = response.usageMetadata;
    await prisma.agentOutput.update({
      where: { id: ao.id },
      data: {
        status: "success",
        output: parsed as any,
        tokensIn: usage?.promptTokenCount ?? null,
        tokensOut: usage?.candidatesTokenCount ?? null,
        costCents: estimateCostCents(cfg.model, usage),
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    return parsed as T;
  } catch (err) {
    await prisma.agentOutput.update({
      where: { id: ao.id },
      data: {
        status: "failed",
        errorJson: serializeError(err),
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

function buildUserMessage({ ctx, input, chunks }: any): string {
  return [
    "# DEAL CONTEXT",
    JSON.stringify(ctx, null, 2),
    "",
    "# INPUT",
    JSON.stringify(input, null, 2),
    "",
    "# RELEVANT CHUNKS",
    chunks
      .map(
        (c: any) =>
          `--- chunk_id=${c.id} doc_id=${c.documentId} ${c.sectionRef ?? ""} page=${c.page ?? "?"} ---\n${c.text}`,
      )
      .join("\n\n"),
    "",
    "Produce JSON conforming to the response schema. Every claim must carry evidence with verbatim quotes.",
  ].join("\n");
}

function estimateCostCents(model: string, usage: any): number {
  // Gemini 3 pricing approx (USD per 1M tokens, update from console):
  //   gemini-3-flash : in $0.075, out $0.30
  //   gemini-3-pro   : in $1.25,  out $5.00
  const rates: Record<string, [number, number]> = {
    "gemini-3-flash": [0.075, 0.3],
    "gemini-3-pro": [1.25, 5.0],
  };
  const [inRate, outRate] = rates[model] ?? [1, 5];
  const tokIn = usage?.promptTokenCount ?? 0;
  const tokOut = usage?.candidatesTokenCount ?? 0;
  const usd = (tokIn * inRate + tokOut * outRate) / 1_000_000;
  return Math.round(usd * 100);
}

function serializeError(e: unknown): object {
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { error: String(e) };
}
```

## `schemas.ts` — Gemini `responseSchema` examples

Gemini schemas use the `Type` enum from `@google/genai`. Snake-case field names align with the agent prompts; zod parses the same shape for runtime safety.

```ts
import { Type } from "@google/genai";
import { z } from "zod";

const evidenceSchema = {
  type: Type.OBJECT,
  properties: {
    doc_id: { type: Type.STRING },
    section: { type: Type.STRING },
    page: { type: Type.INTEGER, nullable: true },
    quote: { type: Type.STRING },
    chunk_id: { type: Type.STRING },
  },
  required: ["doc_id", "section", "quote", "chunk_id"],
};

// ─────────── A1 ───────────
export const A1_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    doc_id: { type: Type.STRING },
    front_category: { type: Type.STRING, enum: ["COMMERCIAL", "FINANCIAL", "LEGAL", "HR", "TAX"] },
    pe_taxonomy: { type: Type.ARRAY, items: { type: Type.STRING } },
    deal_relevance: { type: Type.INTEGER, minimum: 1, maximum: 5 },
    risk_signal: { type: Type.INTEGER, minimum: 0, maximum: 5 },
    redflag_keywords_hit: { type: Type.ARRAY, items: { type: Type.STRING } },
    route_to_agents: { type: Type.ARRAY, items: { type: Type.STRING } },
    evidence: { type: Type.ARRAY, items: evidenceSchema },
  },
  required: [
    "doc_id",
    "front_category",
    "pe_taxonomy",
    "deal_relevance",
    "risk_signal",
    "route_to_agents",
  ],
};

export const A1ZodSchema = z.object({
  doc_id: z.string(),
  front_category: z.enum(["COMMERCIAL", "FINANCIAL", "LEGAL", "HR", "TAX"]),
  pe_taxonomy: z.array(z.string()),
  deal_relevance: z.number().int().min(1).max(5),
  risk_signal: z.number().int().min(0).max(5),
  redflag_keywords_hit: z.array(z.string()).default([]),
  route_to_agents: z.array(z.string()),
  evidence: z.array(z.any()).optional(),
});

export const A1_SYSTEM_PROMPT = `
ROLE: You are a PE deal-room indexer. ...
[paste content from docs/agents/A1_triage_categorization.md "Prompt" section]
`;

// Apply the same pattern for A2..S3.
```

## Concurrency & rate limits

| Agent  | Model     | Concurrency cap (Inngest step) | Reason                                 |
| ------ | --------- | ------------------------------ | -------------------------------------- |
| A1     | flash     | 50                             | Flash RPM ample (>1k/min on paid tier) |
| A2..A9 | flash/pro | 1 each (8 in parallel total)   | Stays under 150 RPM Pro budget         |
| S1, S2 | pro       | 1 each, sequential             | Pro thinking calls expensive           |
| S3     | flash     | 1                              | Sequential gate                        |

Inngest enforces these with the `concurrency` option on each `step.run`.

## Error handling

| Failure                                                       | Action                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Gemini 5xx / 429                                              | Inngest auto-retries with backoff (3 attempts)                             |
| Gemini schema validation failure (rare with `responseSchema`) | One retry with stricter prompt suffix; on second fail → `status: 'failed'` |
| zod parse failure (schema enforced but semantically wrong)    | Same as above                                                              |
| Empty response (`response.text === ''`)                       | Retry once; on fail mark agent failed, pipeline continues                  |
| Cache miss / expired                                          | Recreate transparently in `getOrCreateCache`                               |

## Cost projection (966-doc VDR)

```
A1 × 966 calls (Flash, ~1k tokens in / 200 out, cached system)
   ≈ 966k tok in × $0.075 / 1M  ≈ $0.07
   + 200k tok out × $0.30 / 1M ≈ $0.06
   = ~$0.13

A2..A9 × 1 call each (Flash for 6, Pro for A3+A7)
   Flash agents: 6 × ~50k in / 8k out = $0.04
   Pro thinking agents (A3+A7): 2 × ~70k in / 16k out + 8k thinking
                              ≈ 2 × ($0.09 + $0.08 + $0.04) = $0.42

S1 (Pro thinking) ≈ $0.20
S2 (Pro thinking) ≈ $0.30
S3 × up to 4 (Flash) ≈ $0.04

TOTAL ≈ $1.10 per VDR run
```

vs. ~$21 with my earlier Anthropic Opus/Sonnet projection. **Gemini 3 is ~20× cheaper** for this workload, mostly because Flash handles the structured-extraction agents excellently with `responseSchema`.

## Test harness

```ts
// src/application/agents/A1.triage.test.ts
import { runAgent } from "./shared/run-agent";
// Mock genai — return a fixture JSON
// Assert prisma.agentOutput row is created + parsed correctly
```

Integration tests hit a small VDR fixture (5 PDFs from the dataset) against the real Gemini API, gated by `TEST_GEMINI=1`.
