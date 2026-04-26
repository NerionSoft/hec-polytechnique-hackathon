# AI Due Diligence Copilot — Implementation Plan

> **Codename:** Meridian (working name)
> **Hackathon:** HEC × Polytechnique
> **Stack:** Next.js 16.2.4 · React 19 · Tailwind v4 · TypeScript · lucide-react

---

## 0. North Star

Build an **AI-augmented PE deal platform** that takes a fund from _lead sourcing_ all the way to _IC go/no-go_ — with humans always in the loop.

The pitch in one line:

> **5 days of analyst work → 28 minutes. With sources. With humans approving every claim.**

The product is shaped as a **deal pipeline** (kanban) with stage-aware **deal workspaces** underneath. Each stage of the pipeline triggers AI agents (sourcing, scoring, DD, memo) whose outputs always land in a _pending review_ state for a human to approve.

---

## 1. Design Direction

The visual language inherits the _obsidian_ / dark-premium aesthetic from the current design system:

- **Cinematic dark canvas** — near-black backgrounds, generous negative space
- **Editorial serif headlines** (PT Serif) over **Inter** body text
- **Subtle warm orange** for warnings / red flags / alerts (matches `--warm`)
- **Cool blue accent** for data, links, AI-generated badges (matches `--accent`)
- **Generous radii** — pills (100px) for buttons, 24px for cards
- **Tabular numerals** for any financial figure
- **Photography-grade empty states** — never empty divs, always rich placeholders

Vibe references: Linear (density), Notion AI (citation drawers), Affinity (PE pipeline), Datasite (VDR), the _obsidian_ landing (mood).

### Design tokens — extension to add to `globals.css`

```css
:root {
  /* existing */
  --background: 0 0% 7%; /* deepen base from 10% to 7% for premium */
  --foreground: 0 0% 100%;
  --surface: 0 0% 11%; /* card surface */
  --surface-2: 0 0% 14%; /* nested card / hover */
  --surface-3: 0 0% 18%; /* input bg / pressed */
  --border: 0 0% 20%;
  --border-strong: 0 0% 28%;
  --muted: 0 0% 62%; /* secondary text */
  --subtle: 0 0% 42%; /* tertiary text, captions */

  /* accents */
  --accent: 204 100% 50%;
  --warm: 18 95% 55%;

  /* semantic — severity scale (used for red flags, scoring) */
  --sev-low: 142 60% 45%; /* green */
  --sev-med: 42 95% 55%; /* amber */
  --sev-high: 18 95% 55%; /* warm/orange (matches --warm) */
  --sev-crit: 0 75% 55%; /* red */

  /* semantic — workflow states */
  --state-ai: 204 100% 50%;
  --state-pending: 42 95% 55%;
  --state-approved: 142 60% 45%;
  --state-rejected: 0 0% 50%;
}

@theme inline {
  /* existing tokens carry over */
  --color-surface-2: hsl(var(--surface-2));
  --color-surface-3: hsl(var(--surface-3));
  --color-border: hsl(var(--border));
  --color-muted: hsl(var(--muted));
  --color-subtle: hsl(var(--subtle));
  --color-sev-low: hsl(var(--sev-low));
  --color-sev-med: hsl(var(--sev-med));
  --color-sev-high: hsl(var(--sev-high));
  --color-sev-crit: hsl(var(--sev-crit));
}
```

### Typography scale

| Token     | Size    | Weight       | Usage                 |
| --------- | ------- | ------------ | --------------------- |
| `display` | 48–72px | PT Serif 400 | Hero, deal name       |
| `h1`      | 32px    | PT Serif 400 | Page titles           |
| `h2`      | 22px    | Inter 600    | Section titles        |
| `h3`      | 16px    | Inter 600    | Card titles           |
| `body`    | 14px    | Inter 400    | Default               |
| `small`   | 12px    | Inter 500    | Captions, badges      |
| `mono`    | 13px    | tabular-nums | All financial figures |

---

## 2. Stack & Project Layout

### Dependencies to add

```bash
pnpm add clsx class-variance-authority tailwind-merge \
         @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
         @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-popover \
         framer-motion zustand date-fns recharts \
         react-pdf-viewer
```

> ⚠️ Next.js 16 has breaking changes — always check `node_modules/next/dist/docs/` before writing route handlers, server actions, or middleware.

### Folder structure

```
src/
├── app/
│   ├── (marketing)/                  # public landing
│   │   ├── layout.tsx
│   │   └── page.tsx                  # current landing (keep / refresh)
│   ├── (app)/                        # gated app
│   │   ├── layout.tsx                # sidebar + topbar shell
│   │   ├── pipeline/
│   │   │   ├── page.tsx              # default — kanban
│   │   │   └── [dealId]/
│   │   │       ├── layout.tsx        # workspace shell + tabs
│   │   │       ├── page.tsx          # → redirect to overview
│   │   │       ├── overview/page.tsx
│   │   │       ├── enrichment/page.tsx
│   │   │       ├── outreach/page.tsx
│   │   │       ├── data-room/page.tsx
│   │   │       ├── financials/page.tsx
│   │   │       ├── risks/page.tsx
│   │   │       ├── questions/page.tsx
│   │   │       ├── memo/page.tsx
│   │   │       ├── decision/page.tsx
│   │   │       ├── audit/page.tsx
│   │   │       └── @drawer/          # parallel route — citation viewer
│   │   ├── sources/
│   │   │   ├── page.tsx
│   │   │   └── [leadId]/page.tsx
│   │   ├── outreach/page.tsx
│   │   ├── ic/
│   │   │   ├── page.tsx
│   │   │   └── [meetingId]/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/
│   │       ├── thesis/page.tsx
│   │       ├── team/page.tsx
│   │       └── audit/page.tsx
│   ├── globals.css
│   └── layout.tsx                    # root html shell
├── components/
│   ├── ui/                           # primitives (button, card, badge, …)
│   ├── shell/                        # sidebar, topbar, role-switcher
│   ├── pipeline/                     # kanban, stage column, deal card
│   ├── workspace/                    # deal header, tab nav, stage bar
│   ├── risks/                        # red flag card, severity badge
│   ├── memo/                         # memo editor, citation link
│   ├── data-room/                    # tree view, doc card
│   └── shared/                       # citation drawer, score breakdown
├── lib/
│   ├── mock/                         # all fake data (single source of truth)
│   │   ├── deals.ts
│   │   ├── leads.ts
│   │   ├── documents.ts
│   │   ├── red-flags.ts
│   │   ├── memo.ts
│   │   └── team.ts
│   ├── stores/                       # zustand stores (role, drawer, filters)
│   └── utils.ts                      # cn(), formatters
└── types/
    └── index.ts                      # Deal, Lead, RedFlag, Citation, etc.
```

---

## 3. Mock Data — Single Source of Truth

All fake data lives in `src/lib/mock/` so views can pull from it consistently.

### 3.1 The fund (us)

```ts
// src/lib/mock/fund.ts
export const fund = {
  name: "Meridian Capital Partners",
  shortName: "Meridian",
  fund: "Meridian Fund III",
  aum: "€450M",
  vintage: 2024,
  thesis: {
    sectors: ["B2B SaaS", "Industrial Tech", "Healthtech", "Fintech"],
    geo: ["FR", "DE", "BNL", "Nordics"],
    revenueRange: { min: 15, max: 80, unit: "€M" },
    ebitdaMargin: { min: 15 },
    growth: { min: 20 },
    multipleCap: 12,
  },
};

export const team = [
  { id: "u1", name: "Sophie Marchand", role: "Partner", initials: "SM", avatarHue: 14 },
  { id: "u2", name: "Lucas Ehrmann", role: "VP", initials: "LE", avatarHue: 204 },
  { id: "u3", name: "Aïcha Diallo", role: "Associate", initials: "AD", avatarHue: 280 },
  { id: "u4", name: "Yann Picard", role: "Analyst", initials: "YP", avatarHue: 142 },
  { id: "u5", name: "Claire Volkov", role: "IC Member", initials: "CV", avatarHue: 42 },
];
```

### 3.2 Pipeline deals (12 examples, varied stages)

```ts
// src/lib/mock/deals.ts
export const stages = [
  "sourced",
  "enriched",
  "scored",
  "contacted",
  "engaged",
  "in_dd",
  "ic_ready",
  "decided",
] as const;

export const deals = [
  {
    id: "d1",
    name: "TechFlow SAS",
    sector: "B2B SaaS · Supply Chain",
    geo: "FR",
    flag: "🇫🇷",
    revenue: 45.2, // €M
    ebitda: 11.3,
    ebitdaMargin: 0.25,
    growth: 0.32, // YoY
    netDebtEbitda: 1.8,
    employees: 178,
    founded: 2014,
    stage: "in_dd",
    thesisFit: 87,
    redFlags: 7,
    timeSavedDays: 4.2,
    coverage: 0.92,
    owner: "u3",
    nextAction: "Review legal red flags",
    updatedAt: "2026-04-24T14:22:00Z",
  },
  {
    id: "d2",
    name: "NordicCare ApS",
    sector: "Healthtech · Telemedicine",
    geo: "DK",
    flag: "🇩🇰",
    revenue: 28.4,
    ebitda: 5.1,
    ebitdaMargin: 0.18,
    growth: 0.41,
    netDebtEbitda: 0.9,
    employees: 92,
    founded: 2018,
    stage: "ic_ready",
    thesisFit: 91,
    redFlags: 3,
    timeSavedDays: 5.8,
    coverage: 1.0,
    owner: "u2",
    nextAction: "IC scheduled 2026-05-04",
    updatedAt: "2026-04-25T09:10:00Z",
  },
  {
    id: "d3",
    name: "AlpineLogistics GmbH",
    sector: "Industrial Tech · Last-mile",
    geo: "DE",
    flag: "🇩🇪",
    revenue: 72.1,
    ebitda: 14.4,
    ebitdaMargin: 0.2,
    growth: 0.18,
    netDebtEbitda: 2.7,
    employees: 412,
    founded: 2009,
    stage: "in_dd",
    thesisFit: 73,
    redFlags: 11,
    timeSavedDays: 6.1,
    coverage: 0.78,
    owner: "u3",
    nextAction: "Awaiting QoE confirmation",
    updatedAt: "2026-04-23T16:45:00Z",
  },
  {
    id: "d4",
    name: "Baltica Foods OÜ",
    sector: "Consumer · D2C Food",
    geo: "EE",
    flag: "🇪🇪",
    revenue: 18.0,
    ebitda: 1.9,
    ebitdaMargin: 0.11,
    growth: 0.55,
    netDebtEbitda: 1.2,
    employees: 64,
    founded: 2020,
    stage: "engaged",
    thesisFit: 64,
    redFlags: 4,
    timeSavedDays: 1.5,
    coverage: 0.4,
    owner: "u4",
    nextAction: "NDA signed, awaiting VDR access",
    updatedAt: "2026-04-25T11:00:00Z",
  },
  {
    id: "d5",
    name: "IberiaPay SL",
    sector: "Fintech · B2B Payments",
    geo: "ES",
    flag: "🇪🇸",
    revenue: 34.6,
    ebitda: 9.2,
    ebitdaMargin: 0.27,
    growth: 0.38,
    netDebtEbitda: 0.5,
    employees: 121,
    founded: 2016,
    stage: "contacted",
    thesisFit: 88,
    redFlags: 0,
    timeSavedDays: 0.4,
    coverage: 0.15,
    owner: "u2",
    nextAction: "Warm intro via Banco Santander",
    updatedAt: "2026-04-24T08:30:00Z",
  },
  {
    id: "d6",
    name: "CelticSecure Ltd",
    sector: "Cybersecurity · MSSP",
    geo: "IE",
    flag: "🇮🇪",
    revenue: 22.3,
    ebitda: 4.5,
    ebitdaMargin: 0.2,
    growth: 0.44,
    netDebtEbitda: 0.3,
    employees: 88,
    founded: 2017,
    stage: "scored",
    thesisFit: 82,
    redFlags: 0,
    timeSavedDays: 0.2,
    coverage: 0.1,
    owner: "u4",
    nextAction: "Awaiting outreach approval",
    updatedAt: "2026-04-25T07:00:00Z",
  },
  {
    id: "d7",
    name: "BeNeLux Industries BV",
    sector: "Industrial · IoT Sensors",
    geo: "NL",
    flag: "🇳🇱",
    revenue: 56.8,
    ebitda: 12.5,
    ebitdaMargin: 0.22,
    growth: 0.16,
    netDebtEbitda: 2.1,
    employees: 287,
    founded: 2011,
    stage: "decided",
    decision: "passed",
    thesisFit: 78,
    redFlags: 6,
    timeSavedDays: 5.4,
    coverage: 1.0,
    owner: "u2",
    nextAction: "Term sheet outstanding",
    updatedAt: "2026-04-22T18:00:00Z",
  },
  {
    id: "d8",
    name: "Solar Atlas GmbH",
    sector: "Cleantech · Solar O&M",
    geo: "DE",
    flag: "🇩🇪",
    revenue: 41.0,
    ebitda: 7.8,
    ebitdaMargin: 0.19,
    growth: 0.29,
    netDebtEbitda: 1.5,
    employees: 156,
    founded: 2015,
    stage: "scored",
    thesisFit: 71,
    redFlags: 0,
    timeSavedDays: 0.3,
    coverage: 0.08,
    owner: "u4",
    nextAction: "Reviewing thesis fit",
    updatedAt: "2026-04-24T13:15:00Z",
  },
  {
    id: "d9",
    name: "Helvetia Diagnostics",
    sector: "Healthtech · Lab IT",
    geo: "CH",
    flag: "🇨🇭",
    revenue: 31.2,
    ebitda: 6.4,
    ebitdaMargin: 0.2,
    growth: 0.24,
    netDebtEbitda: 1.1,
    employees: 102,
    founded: 2013,
    stage: "enriched",
    thesisFit: 76,
    redFlags: 0,
    timeSavedDays: 0.1,
    coverage: 0.05,
    owner: "u4",
    nextAction: "Pending scoring",
    updatedAt: "2026-04-25T06:30:00Z",
  },
  {
    id: "d10",
    name: "Polaris HR SAS",
    sector: "B2B SaaS · HR Tech",
    geo: "FR",
    flag: "🇫🇷",
    revenue: 16.5,
    ebitda: 2.1,
    ebitdaMargin: 0.13,
    growth: 0.62,
    netDebtEbitda: 0.4,
    employees: 71,
    founded: 2019,
    stage: "sourced",
    thesisFit: null,
    redFlags: 0,
    timeSavedDays: 0,
    coverage: 0,
    owner: null,
    nextAction: "Awaiting enrichment",
    updatedAt: "2026-04-25T15:00:00Z",
  },
  {
    id: "d11",
    name: "Atlantica Marine SA",
    sector: "Industrial · Maritime",
    geo: "PT",
    flag: "🇵🇹",
    revenue: 24.0,
    ebitda: 3.8,
    ebitdaMargin: 0.16,
    growth: 0.09,
    netDebtEbitda: 3.2,
    employees: 118,
    founded: 2008,
    stage: "decided",
    decision: "rejected",
    thesisFit: 52,
    redFlags: 9,
    timeSavedDays: 2.8,
    coverage: 0.85,
    owner: "u3",
    nextAction: "Passed — thesis fit too low",
    updatedAt: "2026-04-21T11:45:00Z",
  },
  {
    id: "d12",
    name: "Vivara Pet Care",
    sector: "Consumer · Vet Services",
    geo: "BE",
    flag: "🇧🇪",
    revenue: 38.4,
    ebitda: 8.1,
    ebitdaMargin: 0.21,
    growth: 0.27,
    netDebtEbitda: 1.4,
    employees: 142,
    founded: 2012,
    stage: "engaged",
    thesisFit: 79,
    redFlags: 2,
    timeSavedDays: 0.8,
    coverage: 0.32,
    owner: "u3",
    nextAction: "VDR provisioning in progress",
    updatedAt: "2026-04-25T10:20:00Z",
  },
];
```

### 3.3 Lead pool (raw inbound, pre-promotion)

```ts
// src/lib/mock/leads.ts
export const leadSources = [
  { id: "s1", name: "Pitchbook", type: "database", active: true, newToday: 12 },
  { id: "s2", name: "Dealroom.co", type: "database", active: true, newToday: 8 },
  { id: "s3", name: "Sourcescrub", type: "database", active: true, newToday: 5 },
  { id: "s4", name: "LinkedIn Sales", type: "social", active: true, newToday: 14 },
  { id: "s5", name: "Broker emails", type: "inbox", active: true, newToday: 3 },
  { id: "s6", name: "France Invest", type: "newsletter", active: true, newToday: 2 },
  { id: "s7", name: "Crunchbase", type: "database", active: false, newToday: 0 },
];

export const leads = [
  // 30 short entries with name, sector, source, score, status
  // mix of statuses: "new", "enriched", "qualified", "promoted", "dismissed"
  // (truncated for plan readability — fill ~30 at build time)
];
```

### 3.4 Red flags (the hero data)

```ts
// src/lib/mock/red-flags.ts
export const redFlagsTechFlow = [
  {
    id: "rf1",
    severity: "high",
    category: "commercial",
    title: "Customer concentration risk",
    summary: "Top 3 customers represent 62% of FY2024 revenue (HHI 0.41).",
    detail:
      "Customer #1 (Carrefour) alone = 31% of revenue with contract expiring in Q2 2026. No renewal commitment yet.",
    confidence: "high",
    status: "pending_review",
    source: { doc: "Financial_Pack_2024.xlsx", sheet: "Revenue split", page: 4 },
    suggestedQuestion:
      "What is the contractual renewal status of the top-3 customer accounts in the next 18 months?",
    impact: "Revenue volatility; could trigger covenant breach if Carrefour does not renew.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:12:00Z",
  },
  {
    id: "rf2",
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
    source: { doc: "Supply_Agreement_NordPlast.pdf", page: 24, line: "14.2" },
    suggestedQuestion:
      "Has management received a written waiver or commitment from NordPlast regarding a potential change of control?",
    impact: "Deal-breaker if not waived pre-closing. Could halt 78% of production capacity.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:14:00Z",
  },
  {
    id: "rf3",
    severity: "high",
    category: "financial",
    title: "EBITDA add-back aggressiveness",
    summary: "Management presents €2.4M of one-off add-backs (21% of reported EBITDA).",
    detail:
      "Includes €0.9M 'COVID re-organisation' (questionable in 2024), €0.7M 'consulting fees' recurring 3 years in a row, €0.8M 'pre-IPO prep' (no IPO planned).",
    confidence: "medium",
    status: "pending_review",
    source: { doc: "Mgmt_Adjusted_EBITDA_Bridge.xlsx", sheet: "Bridge", page: 1 },
    suggestedQuestion:
      "Can management substantiate the recurring nature of the €0.7M consulting fee add-back?",
    impact: "Adjusted EBITDA may be overstated by €1.5–2.4M, distorting valuation multiple.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:18:00Z",
  },
  {
    id: "rf4",
    severity: "medium",
    category: "legal",
    title: "Unresolved labor litigation (€420k exposure)",
    summary:
      "Three former employees pursuing constructive dismissal — Conseil de Prud'hommes Nanterre.",
    detail:
      "Cases filed 2024-Q4. Claimed damages totalling €420k. No provision booked in FY2024 accounts.",
    confidence: "high",
    status: "pending_review",
    source: { doc: "Legal_Disclosure_Schedule.pdf", page: 11 },
    suggestedQuestion:
      "Why are no provisions booked for ongoing labor cases? What is counsel's probability assessment?",
    impact: "Potential €420k off-balance-sheet liability + reputational risk.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:21:00Z",
  },
  {
    id: "rf5",
    severity: "medium",
    category: "financial",
    title: "Working capital deterioration",
    summary: "DSO increased from 47d to 68d over FY2023→FY2024 (+45%).",
    detail:
      "Trade receivables +€3.1M YoY against revenue growth of +€11M. Suggests stretching customer terms to win renewals.",
    confidence: "high",
    status: "pending_review",
    source: { doc: "Financial_Pack_2024.xlsx", sheet: "Working capital", page: 8 },
    suggestedQuestion:
      "Has management changed standard payment terms with key customers in FY2024?",
    impact: "Cash conversion declining; €2M expected WC outflow in FY2025 if trend continues.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:25:00Z",
  },
  {
    id: "rf6",
    severity: "low",
    category: "operational",
    title: "Single point of failure in tech leadership",
    summary: "CTO is sole signatory on AWS account and holds production credentials.",
    detail:
      "No documented disaster recovery for credential loss. CTO has been with company since 2014 but tied to no key-man clause.",
    confidence: "medium",
    status: "approved",
    approvedBy: "u3",
    source: { doc: "HR_Org_Chart_v3.pdf", page: 2 },
    suggestedQuestion:
      "What is the plan for credential rotation and succession if CTO becomes unavailable?",
    impact: "Operational continuity risk; relatively easy to remediate post-closing.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:27:00Z",
  },
  {
    id: "rf7",
    severity: "high",
    category: "financial",
    title: "Covenant headroom narrowing",
    summary: "Net debt / EBITDA at 1.8x vs covenant ceiling of 2.5x — only 0.7x of headroom.",
    detail:
      "FY2024 covenant test passed with €1.6M of headroom. FY2025 budget shows EBITDA flat → headroom would shrink to 0.4x.",
    confidence: "high",
    status: "pending_review",
    source: { doc: "Senior_Facility_Agreement_2022.pdf", page: 47, line: "Schedule 9 §2.1" },
    suggestedQuestion:
      "Has management modeled a covenant cure scenario? What is the lender's appetite for waiver?",
    impact:
      "If FY2025 underperforms, technical default risk → trigger of cross-default in subordinated debt.",
    raisedBy: "ai",
    createdAt: "2026-04-24T09:30:00Z",
  },
];
```

### 3.5 Documents (data room)

```ts
// src/lib/mock/documents.ts
export const documentsTechFlow = [
  {
    id: "doc1",
    name: "01_Teaser_TechFlow.pdf",
    category: "commercial",
    pages: 18,
    status: "indexed",
    citations: 4,
  },
  {
    id: "doc2",
    name: "02_CIM_TechFlow_2024.pdf",
    category: "commercial",
    pages: 87,
    status: "indexed",
    citations: 12,
  },
  {
    id: "doc3",
    name: "Financial_Pack_2024.xlsx",
    category: "financial",
    pages: 0,
    status: "indexed",
    citations: 23,
  },
  {
    id: "doc4",
    name: "Mgmt_Adjusted_EBITDA_Bridge.xlsx",
    category: "financial",
    pages: 0,
    status: "indexed",
    citations: 6,
  },
  {
    id: "doc5",
    name: "Audited_Accounts_FY2022_FY2023.pdf",
    category: "financial",
    pages: 142,
    status: "indexed",
    citations: 8,
  },
  {
    id: "doc6",
    name: "Audited_Accounts_FY2024.pdf",
    category: "financial",
    pages: 156,
    status: "indexed",
    citations: 11,
  },
  {
    id: "doc7",
    name: "Senior_Facility_Agreement_2022.pdf",
    category: "legal",
    pages: 89,
    status: "indexed",
    citations: 5,
  },
  {
    id: "doc8",
    name: "Supply_Agreement_NordPlast.pdf",
    category: "legal",
    pages: 41,
    status: "indexed",
    citations: 3,
  },
  {
    id: "doc9",
    name: "Legal_Disclosure_Schedule.pdf",
    category: "legal",
    pages: 28,
    status: "indexed",
    citations: 7,
  },
  {
    id: "doc10",
    name: "Customer_Contracts_Top10.zip",
    category: "legal",
    pages: 0,
    status: "indexed",
    citations: 9,
  },
  {
    id: "doc11",
    name: "HR_Org_Chart_v3.pdf",
    category: "hr",
    pages: 6,
    status: "indexed",
    citations: 2,
  },
  {
    id: "doc12",
    name: "HR_Headcount_Compensation.xlsx",
    category: "hr",
    pages: 0,
    status: "indexed",
    citations: 4,
  },
  {
    id: "doc13",
    name: "Tax_Disclosure_2024.pdf",
    category: "tax",
    pages: 22,
    status: "indexed",
    citations: 3,
  },
  {
    id: "doc14",
    name: "Insurance_Policies_Schedule.pdf",
    category: "legal",
    pages: 14,
    status: "indexed",
    citations: 1,
  },
  {
    id: "doc15",
    name: "Business_Plan_2025_2027.pptx",
    category: "commercial",
    pages: 64,
    status: "indexed",
    citations: 9,
  },
  {
    id: "doc16",
    name: "Customer_References_Survey.pdf",
    category: "commercial",
    pages: 31,
    status: "indexed",
    citations: 6,
  },
];
```

### 3.6 IC memo content

```ts
// src/lib/mock/memo.ts
export const memoTechFlow = {
  dealId: "d1",
  status: "draft",
  reviewProgress: 0.71, // 71% of items reviewed
  sections: [
    {
      id: "thesis",
      title: "Investment Thesis",
      body: "TechFlow SAS is a French B2B SaaS player in supply-chain orchestration, serving retailers and consumer-goods companies across Western Europe. The company has demonstrated [32% YoY revenue growth][1], reaching [€45.2M in FY2024][1] with [25% EBITDA margin][2]. The thesis rests on three pillars: (i) consolidation of the fragmented mid-market supply-chain SaaS landscape in Europe, (ii) cross-sell of recently launched analytics module (15% attach rate today, target 40% by 2027), and (iii) geographic expansion into DACH where the company has only 8% of revenue today.",
    },
    {
      id: "snapshot",
      title: "Financial Snapshot",
      // table-style content rendered separately
    },
    {
      id: "risks",
      title: "Key Risks & Mitigants",
      body: "Seven red flags identified, of which two warrant pre-closing remediation:\n\n• [Critical: NordPlast change-of-control clause][rf2] — supplier of 78% of raw materials. Mitigant: obtain written waiver before SPA signing.\n\n• [High: Customer concentration][rf1] — top-3 = 62% of revenue with Carrefour renewal pending. Mitigant: condition closing on contract renewal.\n\n• [High: Aggressive EBITDA add-backs][rf3] — €1.5–2.4M overstatement risk. Mitigant: lock valuation on QoE-validated EBITDA.\n\n• [High: Covenant headroom][rf7] — 0.7x available against 2.5x ceiling. Mitigant: refinance senior facility at closing.",
    },
    {
      id: "questions",
      title: "Questions for Management",
      // list-style — pulled from red flags' suggestedQuestion
    },
    {
      id: "recommendation",
      title: "IC Recommendation",
      body: "Subject to (i) NordPlast waiver, (ii) Carrefour contract renewal, and (iii) QoE confirmation by Big-4 advisor, we recommend proceeding to **non-binding offer at €115M EV (10.2x adjusted EBITDA)**. Final approval contingent on FY2025 Q1 actuals matching budget.",
    },
  ],
};
```

### 3.7 Citations registry

Each citation `[N]` in memo / red flag references a `Citation` object that lets the drawer render the source PDF at the right page, with a highlighted span.

```ts
// src/lib/mock/citations.ts
export type Citation = {
  id: string;
  docId: string;
  page: number;
  excerpt: string;
  bbox?: { x: number; y: number; w: number; h: number };
};

export const citations: Citation[] = [
  {
    id: "c1",
    docId: "doc6",
    page: 12,
    excerpt: "Total revenue FY2024: €45,223,000 (vs €34,210,000 FY2023, +32.2%)",
  },
  {
    id: "c2",
    docId: "doc6",
    page: 18,
    excerpt: "Reported EBITDA: €11,330,000. Adjusted EBITDA per management: €13,742,000",
  },
  // ... mapped from rf.source
];
```

---

## 4. Sitemap & Routes

### Top-level navigation (sidebar)

| Route              | Label       | Icon (lucide)     | Notes                      |
| ------------------ | ----------- | ----------------- | -------------------------- |
| `/pipeline`        | Pipeline    | `LayoutDashboard` | Default landing inside app |
| `/sources`         | Sources     | `Radar`           | Lead intelligence          |
| `/outreach`        | Outreach    | `Mail`            | Conversation inbox         |
| `/ic`              | IC Calendar | `Gavel`           | Upcoming committees        |
| `/portfolio`       | Portfolio   | `Briefcase`       | Stub for hackathon         |
| `/reports`         | Reports     | `BarChart3`       | Stub for hackathon         |
| `/settings/thesis` | Settings    | `Settings2`       | Group                      |

### Per-deal workspace tabs

| Tab        | Visible          | Icon                 |
| ---------- | ---------------- | -------------------- |
| Overview   | always           | `LayoutDashboard`    |
| Enrichment | always           | `Sparkles`           |
| Outreach   | once `contacted` | `Mail`               |
| Data Room  | once `engaged`   | `FolderLock`         |
| Financials | once `in_dd`     | `TrendingUp`         |
| Risks      | once `in_dd`     | `AlertTriangle`      |
| Questions  | once `in_dd`     | `MessageSquareQuote` |
| Memo       | once `in_dd`     | `FileText`           |
| Decision   | once `decided`   | `Gavel`              |
| Audit      | always           | `History`            |

Locked tabs render with `text-subtle` and a tooltip "_Unlocks at stage X_".

---

## 5. Wireframes per Screen

Every box below uses **dark-premium aesthetic**: near-black `bg-background`, surface cards `bg-surface` with `rounded-card`, generous spacing.

### 5.1 App shell (`(app)/layout.tsx`)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                                              │
│ │ MERIDIAN │   Pipeline   Sources   Outreach   IC   Portfolio   Reports  │
│ │ Fund III │                                                              │
│ ├──────────┤            ⌘K Search deals…    🔔 3   [Aïcha · Associate ▾] │
│ │          │ ─────────────────────────────────────────────────────────── │
│ │ • Pipeline│                                                              │
│ │ ◦ Sources │                                                              │
│ │ ◦ Outreach│                  MAIN CONTENT                                │
│ │ ◦ IC (2)  │                                                              │
│ │ ◦ Portf.  │                                                              │
│ │ ◦ Reports │                                                              │
│ │           │                                                              │
│ │ ─────     │                                                              │
│ │ ⚙ Settings│                                                              │
│ └──────────┘                                                              │
└───────────────────────────────────────────────────────────────────────────┘
```

- Sidebar: 240px fixed, `bg-background` with `border-r border-border`
- Topbar: 56px, `bg-surface/40 backdrop-blur` with command palette + role switcher
- Logo wordmark: PT Serif, `text-xl tracking-tight`
- Role switcher pill (top-right): switches whole UI permission set live

### 5.2 `/pipeline` — Kanban (HOME)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Pipeline                                              [ + New deal ▾ ]      │
│                                                                             │
│ This quarter ─────────────────────────────────────────────────────────────  │
│  47 leads sourced    12 in DD    3 IC ready    €184M ARR pipeline           │
│  ⏱ 23.4 analyst-days saved by AI    ↑ +38% vs Q1                            │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ [Kanban] [Table] [Funnel]      Filter: All sectors ▾  Owner: Anyone ▾       │
│                                                                             │
│ ┌─Sourced───┬─Enriched──┬─Scored───┬─Engaged──┬─In DD────┬─IC Ready─┐       │
│ │ 1 deal    │ 1 deal    │ 2 deals  │ 2 deals  │ 2 deals  │ 1 deal   │       │
│ │           │           │          │          │          │          │       │
│ │ ┌───────┐ │ ┌───────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │       │
│ │ │Polaris│ │ │Helvet.│ │ │Celtic│ │ │Baltic│ │ │TechFl│ │ │Nordic│ │       │
│ │ │ HR 🇫🇷│ │ │Diag 🇨🇭│ │ │Sec 🇮🇪│ │ │a 🇪🇪 │ │ │ow 🇫🇷│ │ │Care🇩🇰│ │       │
│ │ │€16.5M │ │ │€31M   │ │ │€22M  │ │ │€18M  │ │ │€45M  │ │ │€28M  │ │       │
│ │ │  --   │ │ │ 76/100│ │ │82/100│ │ │64/100│ │ │87/100│ │ │91/100│ │       │
│ │ │       │ │ │       │ │ │      │ │ │      │ │ │⚠️ 7  │ │ │⚠️ 3  │ │       │
│ │ │ YP    │ │ │ YP    │ │ │ YP   │ │ │ YP   │ │ │ AD   │ │ │ LE   │ │       │
│ │ └───────┘ │ └───────┘ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ └──────┘ │       │
│ │           │           │ │Solar │ │ │Vivar │ │ │Alpine│ │          │       │
│ │           │           │ │Atl 🇩🇪│ │ │a  🇧🇪│ │ │Log🇩🇪│ │          │       │
│ │           │           │ │…     │ │ │…     │ │ │…     │ │          │       │
│ │           │           │ └──────┘ │ └──────┘ │ └──────┘ │          │       │
│ └───────────┴───────────┴──────────┴──────────┴──────────┴──────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Deal card content** (clickable → workspace):

- Top row: name + flag emoji
- Sector (small, subtle)
- Revenue (mono, tabular)
- Thesis fit pill `87/100` colored on severity scale (>80 green, 60-80 amber, <60 red)
- ⚠️ badge with red flag count if any
- Owner avatar bottom-right
- Hover: lift + ring `ring-1 ring-border-strong`

**Drag-and-drop** between columns triggers stage transition (with optimistic update + toast).

### 5.3 `/pipeline/[dealId]/overview` — Deal workspace landing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ◀ Pipeline                                                                  │
│                                                                             │
│   TechFlow SAS                                              [ … actions ▾ ] │
│   🇫🇷 France · B2B SaaS · Supply Chain · Founded 2014 · 178 employees        │
│                                                                             │
│   ●●●●●●○○  In Diligence       Thesis fit 87/100      ⚠️ 7 red flags         │
│                                                       ⏱ 4.2 analyst-days   │
│                                                          saved              │
│                                                                             │
│ ┌─Overview─┬─Enrichment─┬─Outreach─┬─Data Room─┬─Financials─┬─Risks ⚠─┬─… │
│                                                                             │
│ ╔═════════════════════════╗  ╔═══════════════════════════════════════════╗ │
│ ║ DEAL THESIS             ║  ║ KEY METRICS                                ║ │
│ ║ AI draft · approved     ║  ║                                            ║ │
│ ║                         ║  ║ Revenue FY24       €45.2M    +32.2% YoY    ║ │
│ ║ Mid-market European     ║  ║ EBITDA FY24        €11.3M    25.0% margin  ║ │
│ ║ B2B SaaS in supply-     ║  ║ Net debt           €20.3M    1.8x EBITDA   ║ │
│ ║ chain orchestration.    ║  ║ Headcount          178       +24 YoY       ║ │
│ ║ Three pillars: market   ║  ║ ARR                €38.7M    97% recurring ║ │
│ ║ consolidation, analytics║  ║                                            ║ │
│ ║ cross-sell, DACH expan- ║  ║ Source: Financial_Pack_2024.xlsx [view]    ║ │
│ ║ sion. EBITDA growth     ║  ╚═══════════════════════════════════════════╝ │
│ ║ from €11M → €18M by '27.║                                                 │
│ ║ [edit]                  ║  ╔═══════════════════════════════════════════╗ │
│ ╚═════════════════════════╝  ║ TOP RED FLAGS                              ║ │
│                              ║ 🔴 NordPlast change-of-control [view]      ║ │
│ ╔═════════════════════════╗  ║ 🟠 Customer concentration 62% [view]       ║ │
│ ║ STAGE TIMELINE          ║  ║ 🟠 EBITDA add-back aggressiveness [view]   ║ │
│ ║ • Sourced  · Mar 12     ║  ║ 🟠 Covenant headroom narrowing [view]      ║ │
│ ║ • Enriched · Mar 14     ║  ║ 🟡 Labor litigation €420k [view]           ║ │
│ ║ • Scored   · Mar 14     ║  ║                            see all 7 →     ║ │
│ ║ • Contact. · Mar 28     ║  ╚═══════════════════════════════════════════╝ │
│ ║ • Engaged  · Apr 09     ║                                                 │
│ ║ • In DD    · Apr 22     ║  ╔═══════════════════════════════════════════╗ │
│ ║ ○ IC ready              ║  ║ MANAGEMENT QUESTIONS (12)                  ║ │
│ ║ ○ Decided               ║  ║ Approved by VP · awaiting send             ║ │
│ ╚═════════════════════════╝  ║ [ View questions ]  [ Generate memo ]      ║ │
│                              ╚═══════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 `/pipeline/[dealId]/risks` — THE money shot

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TechFlow SAS · Risks                                                        │
│                                                                             │
│ [All 7]  Financial 3   Legal 2   Commercial 1   Operational 1   ESG 0       │
│ Severity ▾  Status: Pending review (5)  ▾   Sort: Severity desc ▾           │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 CRITICAL · LEGAL                            🤖 AI · ⏳ pending review │ │
│ │ Change-of-control clause in main supplier contract                      │ │
│ │                                                                         │ │
│ │ Master supply agreement with NordPlast OY contains automatic            │ │
│ │ termination on change of ownership >50%. NordPlast supplies 78% of      │ │
│ │ raw materials.                                                          │ │
│ │                                                                         │ │
│ │ ↳ Source: Supply_Agreement_NordPlast.pdf · §14.2 · p.24    [view][3]    │ │
│ │ ↳ Confidence: high                                                      │ │
│ │ ↳ Suggested mgmt question:                                              │ │
│ │     "Has management received a written waiver…?"                        │ │
│ │ ↳ Impact: Deal-breaker if not waived pre-closing.                       │ │
│ │                                                                         │ │
│ │ [✓ Approve]  [✎ Edit]  [✗ Dismiss]  [+ Add to memo]  [+ Add to mgmt Q]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟠 HIGH · COMMERCIAL                            🤖 AI · ⏳ pending review │ │
│ │ Customer concentration risk                                             │ │
│ │ Top 3 customers represent 62% of FY2024 revenue (HHI 0.41).             │ │
│ │ ↳ Source: Financial_Pack_2024.xlsx · sheet "Revenue split" · p.4 [view] │ │
│ │ [✓ Approve] [✎ Edit] [✗ Dismiss] [+ Memo] [+ Mgmt Q]                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟠 HIGH · FINANCIAL                                       ✅ approved   │ │
│ │ EBITDA add-back aggressiveness                                          │ │
│ │ Management presents €2.4M of one-off add-backs (21% of reported EBITDA).│ │
│ │ Approved by Lucas Ehrmann · 2026-04-25 08:30                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  … (4 more cards)                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

When the user clicks `[view]` on a citation, the **drawer slides in from the right** (parallel route `@drawer`), 40% width, showing the source PDF page with the relevant span highlighted in `bg-warm/20`.

### 5.5 `/pipeline/[dealId]/financials`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TechFlow SAS · Financials                                                   │
│                                                                             │
│ ┌─KPI─tiles ─────────────────────────────────────────────────────────────┐  │
│ │ Revenue FY24      EBITDA FY24       Net Debt          Growth YoY        │  │
│ │ €45.2M  ↑32.2%    €11.3M  25.0%     €20.3M  1.8x      32.2%             │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─Revenue & EBITDA ──────────────────────┐ ┌─EBITDA Bridge ────────────────┐│
│ │ chart 5y trend                          │ │ Reported     11.3             ││
│ │ ─revenue─                               │ │ + One-off restruct.   0.9     ││
│ │ ─EBITDA─                                │ │ + Consulting fees     0.7 ⚠️  ││
│ │                                         │ │ + Pre-IPO costs       0.8 ⚠️  ││
│ │                                         │ │ ──────────                    ││
│ │                                         │ │ Adjusted     13.7             ││
│ └─────────────────────────────────────────┘ └───────────────────────────────┘│
│                                                                             │
│ ┌─Customer concentration ──────────┐ ┌─Cohort retention ────────────────┐   │
│ │ Carrefour       31%  ━━━━━━━━━━ │ │ NRR 108% · GRR 92% · Churn 8%/yr │   │
│ │ AccorHotels     18%  ━━━━━━     │ │ chart                            │   │
│ │ Pernod Ricard   13%  ━━━━━      │ │                                  │   │
│ │ Carrefour Belg.  6%  ━━         │ │                                  │   │
│ │ Other (45)      32%  ━━━━━━━━━  │ │                                  │   │
│ └──────────────────────────────────┘ └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 `/pipeline/[dealId]/memo`

```
┌──────────────────────────────────────────────────┐ ┌──────────────────────┐
│ ◀ TechFlow SAS · IC Memo                         │ │  SOURCE              │
│ Status: Draft · 71% reviewed · 3 items pending   │ │  Financial_Pack…xlsx │
│                                                  │ │  sheet "P&L summary" │
│ [ Regenerate ▾ ]  [ Export ▾ ]  [ Schedule IC ]  │ │  page 12             │
│ ─────────────────────────────────────────────── │ │                      │
│                                                  │ │  ┌──────────────────┐│
│ § Investment Thesis ⊕                            │ │  │ ...table data... ││
│                                                  │ │  │                  ││
│ TechFlow SAS is a French B2B SaaS player in     │ │  │ Total revenue    ││
│ supply-chain orchestration, serving retailers    │ │  │ FY2024:          ││
│ and consumer-goods companies across Western      │ │  │ €45,223,000  ◄── ││
│ Europe. The company has demonstrated 32% YoY    │ │  │ (vs €34,210,000  ││
│ revenue growth[1], reaching €45.2M in FY2024[1]  │ │  │ FY2023, +32.2%)  ││
│ with 25% EBITDA margin[2]. The thesis rests on  │ │  └──────────────────┘│
│ three pillars: (i) consolidation of the…         │ │                      │
│                                                  │ │  Confidence: high    │
│ § Financial Snapshot ⊕                           │ │                      │
│                                                  │ │  Used in:            │
│ Revenue FY24    €45.2M    +32% YoY              │ │  • Memo §1           │
│ EBITDA FY24     €11.3M    25.0%                  │ │  • Snapshot          │
│ Net debt        €20.3M    1.8x EBITDA            │ │                      │
│                                                  │ │  [Re-extract]        │
│ § Key Risks & Mitigants ⊕                        │ └──────────────────────┘
│                                                  │
│ Seven red flags identified. Two warrant pre-     │
│ closing remediation:                             │
│                                                  │
│ • Critical: NordPlast change-of-control [rf2]    │
│   Mitigant: obtain written waiver before SPA…    │
│                                                  │
│ § Recommendation ⊕                               │
│                                                  │
│ Subject to (i) NordPlast waiver, (ii) Carrefour  │
│ contract renewal, and (iii) QoE confirmation,    │
│ we recommend proceeding to non-binding offer at  │
│ €115M EV (10.2x adjusted EBITDA).                │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Memo column: 60% width with editorial typography (`font-serif` for `§` titles, body in Inter)
- Citation drawer: 40% width, slides in when `[1]` is clicked
- `⊕` = "regenerate this section" inline action
- Citation badges `[1]`, `[2]`, `[rf2]` are pills with `bg-accent/10 text-accent`

### 5.7 `/pipeline/[dealId]/data-room`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Data Room · TechFlow SAS                                                    │
│ 16 documents · 84 citations indexed · last activity 2h ago                  │
│                                                                             │
│ ┌─Tree (240px)─────┐ ┌─List ────────────────────────────────────────────┐  │
│ │ ▾ Commercial (4) │ │ ☐  Name                Status     Cited  Updated │  │
│ │   Teaser         │ │ ◯  01_Teaser…pdf      ●indexed     4    2d ago   │  │
│ │   CIM            │ │ ◯  02_CIM_Tech….pdf   ●indexed    12    2d ago   │  │
│ │   Business plan  │ │ ◯  Financial_Pack.xls ●indexed    23    1d ago   │  │
│ │   Refs survey    │ │ ◯  Mgmt_Adj_EBITDA…   ●indexed     6    1d ago   │  │
│ │ ▾ Financial (4)  │ │ ◯  Audited_Acct_2024  ●indexed    11    2d ago   │  │
│ │   Pack 2024      │ │ ◯  Senior_Facility…   ●indexed     5    2d ago   │  │
│ │   EBITDA bridge  │ │ ◯  Supply_Agreem_Nor… ●indexed     3    2d ago   │  │
│ │   Audit '22-'23  │ │ ◯  Legal_Disclosure   ●indexed     7    2d ago   │  │
│ │   Audit '24      │ │ … 8 more                                         │  │
│ │ ▾ Legal (5)      │ │                                                   │  │
│ │ ▾ HR (2)         │ │ [ + Upload ]  [ Bulk re-index ]                   │  │
│ │ ▾ Tax (1)        │ └───────────────────────────────────────────────────┘  │
│ └──────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.8 `/pipeline/[dealId]/questions`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Management Questions · TechFlow SAS                                         │
│ 12 questions · 8 from AI · 4 manual · 0 sent                                │
│                                                                             │
│ [ Send to management ▾ ]   Status filter: All ▾   Topic filter: All ▾       │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ COMMERCIAL                                                                  │
│   ⊙ What is the contractual renewal status of top-3 customer accounts in   │
│     the next 18 months? — derived from [rf1]                                │
│     🤖 AI · ⏳ pending review · raised by Aïcha · 2 days ago                │
│                                                                             │
│   ⊙ How does the new analytics module attach rate compare against peer     │
│     benchmarks? — manual                                                    │
│     ✅ approved · raised by Sophie · 1 day ago                              │
│                                                                             │
│ LEGAL                                                                       │
│   ⊙ Has management received a written waiver from NordPlast regarding a    │
│     potential change of control? — derived from [rf2]                       │
│     ✅ approved · raised by Lucas · 1 day ago                               │
│                                                                             │
│ FINANCIAL                                                                   │
│   ⊙ Can management substantiate the recurring nature of the €0.7M          │
│     consulting fee add-back? — derived from [rf3]                           │
│     🤖 AI · ⏳ pending review                                                │
│                                                                             │
│   ⊙ Has management modeled a covenant cure scenario? — derived from [rf7]  │
│     🤖 AI · ⏳ pending review                                                │
│                                                                             │
│ … 7 more                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.9 `/sources` — Lead pool

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Lead Sources                                       [ + Configure source ]  │
│                                                                             │
│ This week ─────────────────────────────────────────────                     │
│ 44 new leads · 18 qualified · 6 promoted to deals                           │
│                                                                             │
│ Sources active:  Pitchbook  Dealroom  Sourcescrub  LinkedIn  Brokers       │
│                                                                             │
│ ┌─Lead inbox──────────────────────────────────────────────────────────────┐ │
│ │ Name              Sector            Geo  Rev   Score   Source     ▾    │ │
│ │ ─ NordicAI ApS    Healthtech AI    DK   €19M  84/100  Dealroom  …      │ │
│ │ ─ FinServe SAS    Fintech B2B      FR   €27M  79/100  Pitchbook …      │ │
│ │ ─ AgriBoost SL    Agritech         ES   €11M  62/100  LinkedIn  …      │ │
│ │ ─ DataRoom GmbH   B2B SaaS DevOps  DE   €38M  91/100  Broker    …      │ │
│ │ … 26 more                                                              │ │
│ │ [ Promote selected ]  [ Dismiss selected ]                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.10 `/sources/[leadId]` — Score explainability

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ◀ Sources                                                                   │
│                                                                             │
│   DataRoom GmbH                                          [ Promote to deal ]│
│   🇩🇪 Germany · B2B SaaS · DevOps tooling · Series B · Founded 2017          │
│                                                                             │
│   Thesis fit: 91 / 100                                                      │
│   ──────────────────────────────────────────────                            │
│                                                                             │
│   Sector fit          ━━━━━━━━━━━━━━━━━━━  +25  / 25   (B2B SaaS — match)  │
│   Size fit            ━━━━━━━━━━━━━━━━━     +20 / 25   (€38M — in range)   │
│   Growth              ━━━━━━━━━━━━━━━━━━━   +18 / 20   (47% YoY — above)   │
│   Geo fit             ━━━━━━━━━━━━━━━━━━━━  +20 / 20   (DE — core)         │
│   Profitability       ━━━━━━━━━━━━           +12 / 15   (15% margin — base)│
│   Risk flags          ━━━                    -4 / -10   (recent CTO churn) │
│   ─────                                                                    │
│   Total                                       91 / 100                     │
│                                                                             │
│   Why this matters: matches Meridian Fund III thesis on Industrial DevOps  │
│   consolidation play. Comparable to NordicCare (already in IC ready).      │
│                                                                             │
│   ┌─Enrichment data ──────────────────────────────────────────────────┐    │
│   │ Founders: Klaus Weber (CEO), Petra Hoffmann (CTO — joined Q3 2025)│    │
│   │ Last round: Series B €18M, 2024-09, lead Project A                │    │
│   │ Estimated cap table: Founders 35% / Investors 52% / ESOP 13%      │    │
│   │ Glassdoor: 4.2★ (148 reviews)                                     │    │
│   │ Press: positive coverage in Sifted, Handelsblatt                  │    │
│   └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.11 `/ic` — Calendar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Investment Committee · April–May 2026                                       │
│                                                                             │
│ Upcoming                                                                    │
│ ─────────                                                                   │
│   Tuesday, May 4, 14:00     IC #14                                          │
│   • NordicCare ApS — Final go/no-go     [memo ready]   ✅ all reviewed      │
│   • Vivara Pet Care   — Indicative offer   [memo draft]  ⏳ 3 pending       │
│                                                                             │
│   Tuesday, May 18, 14:00    IC #15                                          │
│   • TechFlow SAS — Final go/no-go         [memo draft]  ⏳ 5 pending        │
│                                                                             │
│ Past                                                                        │
│ ─────                                                                       │
│   Tuesday, April 20, 14:00  IC #13                                          │
│   • BeNeLux Industries BV — Approved      ✅                                │
│   • Atlantica Marine SA — Passed          ✗                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.12 `/ic/[meetingId]`

Memo previews stacked, with vote buttons (`Yes` / `No` / `Abstain`) per IC member, comments thread, decision capture.

### 5.13 `/settings/thesis`

Form with sliders + multi-selects for sector, geo, revenue range, EBITDA margin, growth, multiple cap. Live preview "_Your thesis would have scored DataRoom GmbH 91/100_".

### 5.14 Citation drawer (`@drawer` parallel route)

40%-wide right panel that opens over any view when a `[N]` is clicked. Shows:

- Source doc name
- Page jump (with prev/next page nav)
- Highlighted excerpt
- Confidence + status
- "Used in: …" backlinks
- Actions: Re-extract, Mark inaccurate, Open in viewer

---

## 6. Component Catalogue

UI primitives (`src/components/ui/`):

| Component                                 | Notes                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `Button`                                  | variants: primary (white→black), secondary, ghost, destructive · pill radius |
| `Card`                                    | `bg-surface rounded-card p-6 border border-border/40`                        |
| `Badge`                                   | severity / status pills                                                      |
| `Avatar`                                  | initials w/ avatarHue → `hsl(hue 60% 45%)`                                   |
| `Pill`                                    | thesis fit, score                                                            |
| `Input`, `Textarea`, `Select`, `Checkbox` | dark-themed                                                                  |
| `Tabs`                                    | underline style                                                              |
| `Dialog`, `Drawer`, `Tooltip`, `Popover`  | radix-ui wrappers                                                            |
| `Table`                                   | dense, striped on hover                                                      |
| `Skeleton`                                | shimmer for loading                                                          |

Domain components (`src/components/`):

| Component                                                                | Used in    |
| ------------------------------------------------------------------------ | ---------- |
| `<Sidebar/>`, `<Topbar/>`, `<RoleSwitcher/>`, `<CommandPalette/>`        | shell      |
| `<KanbanBoard/>`, `<StageColumn/>`, `<DealCard/>`                        | pipeline   |
| `<DealHeader/>`, `<StageProgressBar/>`, `<DealTabs/>`                    | workspace  |
| `<KpiTile/>`, `<MetricChart/>`, `<EbitdaBridge/>`, `<ConcentrationBar/>` | financials |
| `<RedFlagCard/>`, `<SeverityBadge/>`, `<ReviewStatusBadge/>`             | risks      |
| `<MemoEditor/>`, `<MemoSection/>`, `<CitationLink/>`                     | memo       |
| `<DocumentTree/>`, `<DocumentList/>`                                     | data room  |
| `<QuestionCard/>`                                                        | questions  |
| `<ScoreBreakdown/>`, `<EnrichmentCard/>`                                 | sources    |
| `<CitationDrawer/>`, `<PdfPreview/>`                                     | shared     |

---

## 7. State Management

Three small `zustand` stores:

```ts
// src/lib/stores/role.ts
type Role = "Analyst" | "VP" | "Partner" | "IC Member";
useRoleStore = { role: Role, setRole: (r: Role) => void }

// src/lib/stores/drawer.ts
useDrawerStore = { citationId: string | null, open(id), close() }

// src/lib/stores/filters.ts (per page)
usePipelineFilters = { sector, owner, view: "kanban"|"table"|"funnel" }
```

No backend for the hackathon — everything reads from `src/lib/mock/`. If time, add a `src/lib/api/` thin layer that returns mock data via promises so the swap to real API later is mechanical.

---

## 8. Build Phases (24–48h plan)

### Phase 0 — Foundation (1.5h)

- Extend `globals.css` with new tokens
- Install dependencies
- Set up `cn()`, font loaders (Inter + PT Serif)
- Wire root layout with fonts + metadata

### Phase 1 — Shell (3h)

- `(app)/layout.tsx` with sidebar + topbar
- Role switcher (zustand store + dropdown)
- Command palette stub (⌘K, displays static results)
- Routing skeleton for all top-level routes

### Phase 2 — Pipeline page (4h)

- Kanban board with 12 mock deals
- Drag-and-drop between columns (framer-motion + dnd-kit)
- Quarter KPI strip
- Filter bar + table/funnel view toggle (basic)

### Phase 3 — Workspace shell (3h)

- `(app)/pipeline/[dealId]/layout.tsx`
- DealHeader + StageProgressBar + tabs
- Locked tabs with tooltip
- Overview tab (cards layout)

### Phase 4 — Risks tab + drawer (5h) ★ MONEY SHOT

- RedFlagCard with severity, status, source
- Filter bar (severity, status, category)
- Approve/edit/dismiss actions
- `@drawer` parallel route with PDF preview placeholder + highlighted excerpt
- CitationLink component (`[N]` → opens drawer)

### Phase 5 — Memo tab (4h)

- Editorial layout with PT Serif headings
- Inline citations `[N]` → drawer
- Section regenerate buttons (mock action)
- Pending-review badge + warning if memo has unreviewed claims
- Export → simple PDF print stylesheet

### Phase 6 — Financials tab (3h)

- KPI tiles
- Recharts: revenue/EBITDA trend, EBITDA bridge waterfall, customer concentration bar
- All with mock data, with citation links to source

### Phase 7 — Sources + Score explainability (3h)

- `/sources` table
- `/sources/[id]` with score breakdown bars
- "Promote to deal" → toast + redirect to pipeline

### Phase 8 — Polish + IC + Settings stubs (4h)

- `/ic` calendar list
- `/settings/thesis` simple form
- Empty states with rich placeholders
- Toasts, animations (framer-motion subtle entrance)
- Mobile breakpoint = "best on desktop" message (hackathon shortcut)

### Phase 9 — Demo prep (2h)

- Seed perfect demo state (TechFlow as the hero deal)
- Walk-through script
- Screenshots for slides

**Total:** ~32h. Realistic for a 2-person team over 48h hackathon, or 1 person flat-out.

---

## 9. Demo Script (3 min, exactly)

**Setup state:** logged in as `Aïcha (Associate)`. Pipeline view open.

**00:00–00:25** — _"Meridian is an AI copilot for European mid-market PE funds. Today we'll walk a deal from a database lead all the way to an IC memo, in under three minutes. Manually this would take an analyst five days."_
→ Show `/pipeline`. Hover the **23.4 days saved this quarter** stat.

**00:25–00:55** — _"Every morning, the platform ingests fresh leads from Pitchbook, Dealroom, brokers. Each is auto-scored against our fund thesis."_
→ Click `/sources`. Click **DataRoom GmbH (91/100)**. Show score breakdown.
→ _"The score is fully explainable — sector match, size, growth, with a deduction for the recent CTO change. No black box."_

**00:55–01:30** — _"Let's promote a deal that's already further along."_
→ Back to `/pipeline`. Click **TechFlow SAS** in _In DD_.
→ Show overview: thesis card, 4 KPIs with growth, top red flags, 4.2 days saved badge, stage timeline.

**01:30–02:10** — _"This is the heart of the product."_
→ Click **Risks** tab.
→ _"Seven flags identified across five categories. Every claim is grounded in a source — let me prove it."_
→ Click `[view]` on the **NordPlast change-of-control** flag. Drawer slides in.
→ _"Page 24, section 14.2 — and the system flagged it as critical because NordPlast supplies 78% of raw materials. The system also drafted a question for management."_
→ Click `[Approve]`. Status flips to ✅.

**02:10–02:40** — _"Now let's see this aggregated into an IC memo."_
→ Click **Memo** tab.
→ Scroll through Thesis → Snapshot → Risks → Recommendation.
→ Click `[2]` next to "25% EBITDA margin". Drawer opens at the right page.
→ _"Every figure is traceable. And — critically — the system blocks export until every claim is reviewed by a human."_
→ Toggle "Show only pending review" → 3 highlighted items.

**02:40–03:00** — _"Switch to a Partner view."_
→ Click role switcher → **Partner**. UI changes (extra IC vote panel becomes visible).
→ _"Partners see vote controls, IC calendar, fund-wide pipeline. Each role sees what they need."_
→ End on the pipeline view: _"5 days → 28 minutes. 23 analyst-days saved this quarter. With humans approving every claim. Thank you."_

---

## 10. Risks & Open Questions

| Risk                                | Mitigation                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 16 breaking changes unknown | Always check `node_modules/next/dist/docs/` before route handlers / server actions                                                 |
| PDF viewer integration too heavy    | For demo: render a static image of the PDF page with a CSS-overlaid highlight rectangle. Skip real PDF.js.                         |
| Drag-and-drop time sink             | dnd-kit minimal setup; if blocking, fall back to right-click "Move to stage ▾" menu                                                |
| Memo editor scope creep             | Read-only memo + "Regenerate" button is enough for demo. No real editing.                                                          |
| Mobile responsiveness               | Out of scope. Desktop ≥1280px only. Show banner on mobile.                                                                         |
| Real auth                           | Stub with role switcher in topbar. No login page.                                                                                  |
| LLM integration                     | All AI outputs are pre-baked in mock data. No live calls. If time, add one Claude call in score explainability for the wow factor. |

---

## 11. What we deliberately don't build

- Real lead scrapers (just show config UI)
- Real outreach mailbox (1 mock conversation visible)
- Real VDR provisioning + watermarking (visual only)
- Portfolio post-investment (link only, page is a stub)
- Comparison between two documents (mention in roadmap)
- Multi-tenancy / multi-fund (single fund, but mention)
- ESG scoring module (placeholder in red flag categories)
- Real audit log persistence (table with seeded rows)

These are visible as **roadmap pills** in the appropriate location ("Coming soon" subtle badge).

---

## 12. Definition of Done — Hackathon

A judge can:

1. Open the pipeline and read the value prop in <10 seconds (KPI strip)
2. Click any deal and reach the workspace in 1 click
3. See red flags grouped by severity with color coding
4. Click any citation and watch the drawer open with the source highlighted
5. See the IC memo with at least 3 cited sections
6. Toggle role and see the UI change
7. Walk through the demo script without bugs

If those 7 work, we ship.
