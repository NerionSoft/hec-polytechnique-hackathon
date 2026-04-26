export type Severity = "low" | "medium" | "high" | "critical";
export type RedFlagCategory = "financial" | "legal" | "commercial" | "operational" | "esg";
export type ReviewStatus = "pending_review" | "approved" | "dismissed";

export type RedFlag = {
  id: string;
  dealId: string;
  severity: Severity;
  category: RedFlagCategory;
  title: string;
  summary: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  status: ReviewStatus;
  approvedBy?: string;
  approvedAt?: string;
  source: { docId: string; sheet?: string; page: number; line?: string };
  suggestedQuestion: string;
  impact: string;
  raisedBy: "ai" | "human";
  createdAt: string;
};

export const redFlags: RedFlag[] = [
  {
    id: "rf1",
    dealId: "helios",
    severity: "critical",
    category: "legal",
    title: "Change-of-control clause in main supplier contract",
    summary:
      "Master supply agreement with NordPlast OY contains automatic termination on change of ownership.",
    detail:
      "Section 14.2 of the supply agreement signed 2022-03-15 allows NordPlast to terminate within 30 days of any change of control >50%. NordPlast supplies 78% of raw materials.",
    confidence: "high",
    status: "approved",
    approvedBy: "u2",
    approvedAt: "2026-04-25T08:30:00Z",
    source: { docId: "doc8", page: 24, line: "§14.2" },
    suggestedQuestion:
      "Has management received a written waiver or commitment from NordPlast regarding a potential change of control?",
    impact: "Deal-breaker if not waived pre-closing. Could halt 78% of production capacity.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:14:00Z",
  },
  {
    id: "rf2",
    dealId: "helios",
    severity: "high",
    category: "commercial",
    title: "Customer concentration risk",
    summary: "Top 3 customers represent 64% of FY2024 revenue (HHI 0.41).",
    detail:
      "Customer #1 (Carrefour) alone = 31% of revenue with contract expiring in Q2 2026. No renewal commitment yet.",
    confidence: "high",
    status: "pending_review",
    source: { docId: "doc3", sheet: "Revenue split", page: 4 },
    suggestedQuestion:
      "What is the contractual renewal status of the top-3 customer accounts in the next 18 months?",
    impact: "Revenue volatility; could trigger covenant breach if Carrefour does not renew.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:12:00Z",
  },
  {
    id: "rf3",
    dealId: "helios",
    severity: "high",
    category: "financial",
    title: "EBITDA add-back aggressiveness",
    summary: "Management presents €2.1M of one-off add-backs (50% of reported EBITDA).",
    detail:
      "Includes €0.9M 'COVID re-organisation' (questionable in 2024), €0.7M 'consulting fees' recurring 3 years in a row, €0.5M 'pre-IPO prep' (no IPO planned).",
    confidence: "medium",
    status: "pending_review",
    source: { docId: "doc4", sheet: "Bridge", page: 1 },
    suggestedQuestion:
      "Can management substantiate the recurring nature of the €0.7M consulting fee add-back?",
    impact: "Adjusted EBITDA may be overstated by €1.2–2.1M, distorting valuation multiple.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:18:00Z",
  },
  {
    id: "rf4",
    dealId: "helios",
    severity: "high",
    category: "financial",
    title: "Senior debt covenant headroom",
    summary: "Net debt / EBITDA at 3.4x, breached covenant ceiling for 2 quarters in 2024.",
    detail:
      "Senior facility covenant ceiling is 3.0x. Headroom test failed in Q2 and Q3 2024 — waiver granted by lender, but at the cost of a 75bps margin step-up.",
    confidence: "high",
    status: "pending_review",
    source: { docId: "doc7", page: 47, line: "Schedule 9 §2.1" },
    suggestedQuestion:
      "Has management modeled a covenant cure scenario? What is the lender's appetite for permanent waiver?",
    impact:
      "If FY2025 underperforms, technical default risk → trigger of cross-default in subordinated debt.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:30:00Z",
  },
  {
    id: "rf5",
    dealId: "helios",
    severity: "medium",
    category: "legal",
    title: "Unresolved labor litigation (€420k exposure)",
    summary:
      "Three former employees pursuing constructive dismissal — Conseil de Prud'hommes Nanterre.",
    detail:
      "Cases filed 2024-Q4. Claimed damages totalling €420k. No provision booked in FY2024 accounts.",
    confidence: "high",
    status: "pending_review",
    source: { docId: "doc9", page: 11 },
    suggestedQuestion:
      "Why are no provisions booked for ongoing labor cases? What is counsel's probability assessment?",
    impact: "Potential €420k off-balance-sheet liability + reputational risk.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:21:00Z",
  },
  {
    id: "rf6",
    dealId: "helios",
    severity: "medium",
    category: "financial",
    title: "Working capital deterioration",
    summary: "DSO increased from 47d to 68d over FY2023 → FY2024 (+45%).",
    detail:
      "Trade receivables +€3.1M YoY against revenue growth of +€11M. Suggests stretching customer terms to win renewals.",
    confidence: "high",
    status: "pending_review",
    source: { docId: "doc3", sheet: "Working capital", page: 8 },
    suggestedQuestion:
      "Has management changed standard payment terms with key customers in FY2024?",
    impact: "Cash conversion declining; €2M expected WC outflow in FY2025 if trend continues.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:25:00Z",
  },
  {
    id: "rf7",
    dealId: "helios",
    severity: "low",
    category: "operational",
    title: "Single point of failure in tech leadership",
    summary: "CTO is sole signatory on AWS account and holds production credentials.",
    detail:
      "No documented disaster recovery for credential loss. CTO has been with company since 2014 but tied to no key-man clause.",
    confidence: "medium",
    status: "approved",
    approvedBy: "u3",
    approvedAt: "2026-04-25T14:02:00Z",
    source: { docId: "doc11", page: 2 },
    suggestedQuestion:
      "What is the plan for credential rotation and succession if CTO becomes unavailable?",
    impact: "Operational continuity risk; relatively easy to remediate post-closing.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:27:00Z",
  },
];

export function redFlagsForDeal(dealId: string): RedFlag[] {
  return redFlags.filter((rf) => rf.dealId === dealId);
}
