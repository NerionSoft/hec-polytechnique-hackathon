export type MemoSection = {
  id: string;
  title: string;
  body: string;
  reviewed: boolean;
};

export type Memo = {
  dealId: string;
  status: "draft" | "review" | "final";
  reviewProgress: number;
  pendingItems: number;
  lastEditedBy: string;
  lastEditedAt: string;
  sections: MemoSection[];
};

export const memoHelios: Memo = {
  dealId: "helios",
  status: "draft",
  reviewProgress: 0.71,
  pendingItems: 3,
  lastEditedBy: "u3",
  lastEditedAt: "2026-04-25T22:08:00Z",
  sections: [
    {
      id: "thesis",
      title: "Investment Thesis",
      reviewed: true,
      body:
        "Helios AgriTech is a French vertically-integrated agritech player in specialty crops, serving European retailers and food brands. The company has demonstrated [18% YoY revenue growth][c1], reaching [€31.0M in FY2024][c1] with [13.5% EBITDA margin][c2]. The thesis rests on three pillars: (i) consolidation of the fragmented mid-market specialty-crop sector across Western Europe, (ii) cross-sell of recently launched precision-irrigation module (12% attach rate today, target 35% by 2027), and (iii) DACH expansion where Helios has only 7% of revenue today.",
    },
    {
      id: "snapshot",
      title: "Financial Snapshot",
      reviewed: true,
      body:
        "Revenue FY24: €31.0M (+18% YoY)[c1] · EBITDA FY24: €4.2M (13.5% margin)[c2] · Net Debt €14.3M (3.4x EBITDA)[c4] · ARR €24.6M (97% recurring) · Headcount 142 (+18 YoY).",
    },
    {
      id: "risks",
      title: "Key Risks & Mitigants",
      reviewed: false,
      body:
        "Twelve red flags identified, of which two warrant pre-closing remediation:\n\n• Critical: NordPlast change-of-control clause [rf1] — supplier of 78% of raw materials. Mitigant: obtain written waiver before SPA signing.\n\n• High: Customer concentration [rf2] — top-3 = 64% of revenue with Carrefour renewal pending. Mitigant: condition closing on contract renewal.\n\n• High: Aggressive EBITDA add-backs [rf3] — €1.2–2.1M overstatement risk. Mitigant: lock valuation on QoE-validated EBITDA.\n\n• High: Covenant headroom [rf4] — breached for 2 quarters in 2024. Mitigant: refinance senior facility at closing.",
    },
    {
      id: "questions",
      title: "Questions for Management",
      reviewed: false,
      body:
        "1. What is the contractual renewal status of top-3 customer accounts in the next 18 months?\n2. Has management received a written waiver from NordPlast regarding a potential change of control?\n3. Can management substantiate the recurring nature of the €0.7M consulting fee add-back?\n4. Has management modeled a covenant cure scenario for FY2025?\n5. Why are no provisions booked for ongoing labor cases?",
    },
    {
      id: "recommendation",
      title: "IC Recommendation",
      reviewed: false,
      body:
        "Subject to (i) NordPlast waiver, (ii) Carrefour contract renewal, and (iii) QoE confirmation by Big-4 advisor, we recommend proceeding to non-binding offer at €78M EV (10.2x adjusted EBITDA). Final approval contingent on FY2025 Q1 actuals matching budget.",
    },
  ],
};
