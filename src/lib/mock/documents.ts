export type DocCategory = "commercial" | "financial" | "legal" | "hr" | "tax";

export type Document = {
  id: string;
  dealId: string;
  name: string;
  category: DocCategory;
  pages: number;
  status: "uploaded" | "indexed" | "failed";
  citations: number;
  updatedAt: string;
};

export const documents: Document[] = [
  {
    id: "doc1",
    dealId: "helios",
    name: "01_Teaser_Helios.pdf",
    category: "commercial",
    pages: 18,
    status: "indexed",
    citations: 4,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc2",
    dealId: "helios",
    name: "02_CIM_Helios_2024.pdf",
    category: "commercial",
    pages: 87,
    status: "indexed",
    citations: 12,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc3",
    dealId: "helios",
    name: "Financial_Pack_2024.xlsx",
    category: "financial",
    pages: 0,
    status: "indexed",
    citations: 23,
    updatedAt: "2026-04-24T08:00Z",
  },
  {
    id: "doc4",
    dealId: "helios",
    name: "Mgmt_Adjusted_EBITDA_Bridge.xlsx",
    category: "financial",
    pages: 0,
    status: "indexed",
    citations: 6,
    updatedAt: "2026-04-24T08:00Z",
  },
  {
    id: "doc5",
    dealId: "helios",
    name: "Audited_Accounts_FY22_FY23.pdf",
    category: "financial",
    pages: 142,
    status: "indexed",
    citations: 8,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc6",
    dealId: "helios",
    name: "Audited_Accounts_FY2024.pdf",
    category: "financial",
    pages: 156,
    status: "indexed",
    citations: 11,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc7",
    dealId: "helios",
    name: "Senior_Facility_Agreement_2022.pdf",
    category: "legal",
    pages: 89,
    status: "indexed",
    citations: 5,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc8",
    dealId: "helios",
    name: "Supply_Agreement_NordPlast.pdf",
    category: "legal",
    pages: 41,
    status: "indexed",
    citations: 3,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc9",
    dealId: "helios",
    name: "Legal_Disclosure_Schedule.pdf",
    category: "legal",
    pages: 28,
    status: "indexed",
    citations: 7,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc10",
    dealId: "helios",
    name: "Customer_Contracts_Top10.zip",
    category: "legal",
    pages: 0,
    status: "indexed",
    citations: 9,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc11",
    dealId: "helios",
    name: "HR_Org_Chart_v3.pdf",
    category: "hr",
    pages: 6,
    status: "indexed",
    citations: 2,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc12",
    dealId: "helios",
    name: "HR_Headcount_Compensation.xlsx",
    category: "hr",
    pages: 0,
    status: "indexed",
    citations: 4,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc13",
    dealId: "helios",
    name: "Tax_Disclosure_2024.pdf",
    category: "tax",
    pages: 22,
    status: "indexed",
    citations: 3,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc14",
    dealId: "helios",
    name: "Insurance_Policies_Schedule.pdf",
    category: "legal",
    pages: 14,
    status: "indexed",
    citations: 1,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc15",
    dealId: "helios",
    name: "Business_Plan_2025_2027.pptx",
    category: "commercial",
    pages: 64,
    status: "indexed",
    citations: 9,
    updatedAt: "2026-04-23T10:00Z",
  },
  {
    id: "doc16",
    dealId: "helios",
    name: "Customer_References_Survey.pdf",
    category: "commercial",
    pages: 31,
    status: "indexed",
    citations: 6,
    updatedAt: "2026-04-23T10:00Z",
  },
];

export function documentsForDeal(dealId: string): Document[] {
  return documents.filter((d) => d.dealId === dealId);
}

export function getDocument(id: string): Document | undefined {
  return documents.find((d) => d.id === id);
}
