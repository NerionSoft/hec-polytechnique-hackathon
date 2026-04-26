export type Citation = {
  id: string;
  docId: string;
  page: number;
  excerpt: string;
  confidence: "high" | "medium" | "low";
  usedIn: string[];
};

export const citations: Record<string, Citation> = {
  c1: {
    id: "c1",
    docId: "doc6",
    page: 12,
    excerpt:
      "Total revenue FY2024: €31,032,400 (vs €26,290,200 FY2023, +18.0%). Recurring revenue €24,650,000 (97% of total).",
    confidence: "high",
    usedIn: ["Memo · Thesis", "Memo · Snapshot", "Overview KPIs"],
  },
  c2: {
    id: "c2",
    docId: "doc6",
    page: 18,
    excerpt:
      "Reported EBITDA: €4,189,000 (13.5% margin). Adjusted EBITDA per management: €6,290,000 (subject to QoE review).",
    confidence: "high",
    usedIn: ["Memo · Thesis", "Memo · Snapshot", "Overview KPIs"],
  },
  c3: {
    id: "c3",
    docId: "doc3",
    page: 4,
    excerpt:
      "Top-3 customers FY2024: Carrefour 31%, Auchan 19%, Pernod Ricard 14%. Combined 64% of revenue.",
    confidence: "high",
    usedIn: ["Memo · Risks", "Red flag rf2"],
  },
  c4: {
    id: "c4",
    docId: "doc7",
    page: 28,
    excerpt:
      "Net debt as of 31 Dec 2024: €14,278,000. Senior facility €11.5M at 5.25% margin (post step-up). Subordinated €2.78M at 9% PIK.",
    confidence: "high",
    usedIn: ["Memo · Snapshot", "Risk rf4"],
  },
  c5: {
    id: "c5",
    docId: "doc8",
    page: 24,
    excerpt:
      "§14.2 Change of Control. The Supplier may terminate this Agreement with 30 days' written notice if the Buyer undergoes a change of beneficial ownership exceeding fifty percent (50%).",
    confidence: "high",
    usedIn: ["Red flag rf1", "Memo · Risks"],
  },
};

export function getCitation(id: string): Citation | undefined {
  return citations[id];
}
