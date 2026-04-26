import { z } from "zod";

export const SCHEMA_VERSION = "v1";

export const EnrichmentObjectSchema = z.object({
  businessSummary: z
    .string()
    .min(40)
    .max(600)
    .describe("2–3 sentence description of the company in plain English."),
  investmentRationale: z
    .array(z.string().min(8).max(180))
    .min(2)
    .max(6)
    .describe("PE investment thesis bullets, terse."),
  concerns: z
    .array(z.string().min(8).max(180))
    .min(1)
    .max(4)
    .describe("Risk/red-flag bullets to verify in due diligence."),
  suggestedOutreachAngle: z
    .string()
    .min(15)
    .max(300)
    .describe("1-2 sentence pitch hook for the founder/CEO."),
  peFitScore: z.number().int().min(0).max(100),
  peFitDecision: z.enum(["REJECT", "WATCHLIST", "OUTREACH"]),
  reasons: z
    .array(z.string().min(8).max(180))
    .min(1)
    .max(5)
    .describe("Reasons backing the score and decision."),
  missingInfo: z
    .array(z.string().min(5).max(180))
    .min(0)
    .max(6)
    .describe("Key data gaps preventing higher confidence."),
});

export type EnrichmentObject = z.infer<typeof EnrichmentObjectSchema>;

export const SYSTEM_PROMPT = `You are a senior screening analyst for a lower-mid-market private equity fund.
You evaluate small-to-mid European SMEs (revenue €2M–€50M, founder-owned preferred) against a buy-and-build / succession / profitability-improvement thesis.

Rules:
- Source-backed only: rely strictly on the provided lead and website snapshot. Do not invent facts.
- Conservative bias: if data is thin, lower the score and populate missingInfo[].
- No investment advice: produce a screening view, not a recommendation to invest.
- Score bands MUST self-align with the decision:
  - peFitScore < 40   → peFitDecision = "REJECT"
  - peFitScore 40-69  → peFitDecision = "WATCHLIST"
  - peFitScore >= 70  → peFitDecision = "OUTREACH"
- Tone: terse, analytical, English unless the company is clearly French (then mix is OK).`;
