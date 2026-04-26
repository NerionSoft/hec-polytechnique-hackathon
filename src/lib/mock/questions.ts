export type Question = {
  id: string;
  dealId: string;
  topic: "commercial" | "legal" | "financial" | "operational" | "hr";
  body: string;
  derivedFrom?: string;
  status: "pending_review" | "approved" | "sent" | "answered";
  raisedBy: string;
  raisedById: "ai" | string;
  createdAt: string;
};

export const questions: Question[] = [
  {
    id: "q1",
    dealId: "helios",
    topic: "commercial",
    body: "What is the contractual renewal status of top-3 customer accounts in the next 18 months?",
    derivedFrom: "rf2",
    status: "pending_review",
    raisedBy: "Aïcha Diallo",
    raisedById: "ai",
    createdAt: "2026-04-24T09:12:00Z",
  },
  {
    id: "q2",
    dealId: "helios",
    topic: "legal",
    body: "Has management received a written waiver from NordPlast regarding a potential change of control?",
    derivedFrom: "rf1",
    status: "approved",
    raisedBy: "Lucas Ehrmann",
    raisedById: "u2",
    createdAt: "2026-04-24T09:14:00Z",
  },
  {
    id: "q3",
    dealId: "helios",
    topic: "financial",
    body: "Can management substantiate the recurring nature of the €0.7M consulting fee add-back?",
    derivedFrom: "rf3",
    status: "pending_review",
    raisedBy: "Aïcha Diallo",
    raisedById: "ai",
    createdAt: "2026-04-24T09:18:00Z",
  },
  {
    id: "q4",
    dealId: "helios",
    topic: "financial",
    body: "Has management modeled a covenant cure scenario for FY2025?",
    derivedFrom: "rf4",
    status: "pending_review",
    raisedBy: "Aïcha Diallo",
    raisedById: "ai",
    createdAt: "2026-04-24T09:30:00Z",
  },
  {
    id: "q5",
    dealId: "helios",
    topic: "legal",
    body: "Why are no provisions booked for ongoing labor cases? What is counsel's probability assessment?",
    derivedFrom: "rf5",
    status: "pending_review",
    raisedBy: "Aïcha Diallo",
    raisedById: "ai",
    createdAt: "2026-04-24T09:21:00Z",
  },
  {
    id: "q6",
    dealId: "helios",
    topic: "commercial",
    body: "How does the new precision-irrigation module attach rate compare against peer benchmarks?",
    status: "approved",
    raisedBy: "Sophie Marchand",
    raisedById: "u1",
    createdAt: "2026-04-25T08:00:00Z",
  },
  {
    id: "q7",
    dealId: "helios",
    topic: "operational",
    body: "What is the plan for credential rotation and succession if CTO becomes unavailable?",
    derivedFrom: "rf7",
    status: "approved",
    raisedBy: "Aïcha Diallo",
    raisedById: "ai",
    createdAt: "2026-04-24T09:27:00Z",
  },
];

export function questionsForDeal(dealId: string) {
  return questions.filter((q) => q.dealId === dealId);
}
