export type AuditEntry = {
  id: string;
  dealId?: string;
  actor: "ai" | string;
  action: string;
  target: string;
  timestamp: string;
};

export const audit: AuditEntry[] = [
  { id: "a1",  dealId: "helios", actor: "ai", action: "extracted",   target: "EBITDA bridge from Mgmt_Adjusted_EBITDA_Bridge.xlsx", timestamp: "2026-04-24T09:18:00Z" },
  { id: "a2",  dealId: "helios", actor: "ai", action: "raised flag", target: "rf3 · EBITDA add-back aggressiveness",                timestamp: "2026-04-24T09:18:00Z" },
  { id: "a3",  dealId: "helios", actor: "u3", action: "approved",    target: "rf7 · CTO single point of failure",                   timestamp: "2026-04-25T14:02:00Z" },
  { id: "a4",  dealId: "helios", actor: "u2", action: "approved",    target: "rf1 · NordPlast change-of-control",                   timestamp: "2026-04-25T08:30:00Z" },
  { id: "a5",  dealId: "helios", actor: "ai", action: "drafted",     target: "Memo §1 Investment Thesis",                            timestamp: "2026-04-24T09:32:00Z" },
  { id: "a6",  dealId: "helios", actor: "u1", action: "edited",      target: "Memo §1 Investment Thesis (3 lines changed)",         timestamp: "2026-04-25T11:15:00Z" },
  { id: "a7",  dealId: "helios", actor: "ai", action: "drafted",     target: "Mgmt question Q3 (consulting fees substantiation)",   timestamp: "2026-04-24T09:18:00Z" },
  { id: "a8",  dealId: "helios", actor: "u3", action: "uploaded",    target: "Customer_References_Survey.pdf",                       timestamp: "2026-04-23T10:14:00Z" },
  { id: "a9",  dealId: "helios", actor: "ai", action: "indexed",     target: "16 documents · 84 citations extracted",                timestamp: "2026-04-23T11:02:00Z" },
  { id: "a10", dealId: "nordiccare", actor: "u2", action: "scheduled IC",  target: "IC #14 · 2026-05-04",                            timestamp: "2026-04-24T15:00:00Z" },
  { id: "a11", dealId: "benelux",     actor: "u1", action: "voted yes",   target: "IC #13 · final go/no-go",                        timestamp: "2026-04-20T14:48:00Z" },
  { id: "a12", dealId: "atlantica",   actor: "u1", action: "voted no",    target: "IC #13 · final go/no-go",                        timestamp: "2026-04-20T14:51:00Z" },
];

export function auditForDeal(dealId: string) {
  return audit
    .filter((a) => a.dealId === dealId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
