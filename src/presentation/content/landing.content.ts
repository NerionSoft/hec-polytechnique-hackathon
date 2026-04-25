export const landingContent = {
  brand: {
    name: "Athena",
  },
  navigation: {
    links: [
      { label: "Product", href: "#product" },
      { label: "Pipeline", href: "#pipeline" },
      { label: "Features", href: "#features" },
      { label: "About", href: "#about" },
    ],
    cta: "Request access",
  },
  hero: {
    title: "From data room to IC memo in 30 minutes",
    subtitle:
      "AI Due Diligence Copilot for lower-mid-market private " +
      "equity. Upload a data room, get sourced red flags, " +
      "management questions and a draft IC memo — not in days.",
    cta: "Try Athena",
    secondaryCta: "Watch a demo",
  },
  cockpit: {
    deal: "Helios AgriTech",
    period: "Q3 2025 · Series B target",
    statusLabel: "Live analysis",
    breadcrumb: "Workspace · Helios AgriTech · Cockpit",
    nav: [
      { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { id: "dataroom", label: "Data Room", icon: "FolderClosed" },
      { id: "search", label: "Search", icon: "Search" },
      { id: "analysis", label: "Analysis", icon: "BarChart3" },
      { id: "redflags", label: "Red Flags", icon: "ShieldAlert" },
      { id: "memo", label: "IC Memo", icon: "FileText" },
      { id: "settings", label: "Settings", icon: "Settings" },
    ],
    stream: {
      title: "Sourced red flags",
      meta: "247 documents · 12 flags · 47 citations",
      items: [
        {
          severity: "high" as const,
          title: "Customer concentration",
          body: "Top-3 customers represent 64% of FY24 revenue.",
          source: "Annexe-3.xlsx · p.12",
          tag: "Commercial",
        },
        {
          severity: "high" as const,
          title: "EBITDA bridge",
          body: "€2.1M of one-off adjustments to normalize.",
          source: "P&L 2024.pdf · p.04",
          tag: "Finance",
        },
        {
          severity: "medium" as const,
          title: "Senior debt covenant",
          body: "Headroom breached for 2 quarters in 2024.",
          source: "Loan agreement.pdf · §4.2",
          tag: "Finance",
        },
        {
          severity: "low" as const,
          title: "IP ownership",
          body: "2 patents jointly owned with prior employer.",
          source: "Patent assignment.pdf · §2",
          tag: "Legal",
        },
      ],
    },
    stats: {
      title: "Snapshot",
      items: [
        { label: "Revenue FY24", value: "€31.0M", trend: "up" as const,
          delta: "+18%" },
        { label: "EBITDA", value: "€4.2M", trend: "up" as const,
          delta: "13.5% margin" },
        { label: "Net Debt / EBITDA", value: "3.4×",
          trend: "down" as const, delta: "-0.2× YoY" },
        { label: "Top-3 customers", value: "64%",
          trend: "warn" as const, delta: "concentrated" },
      ],
    },
    readiness: {
      label: "IC readiness",
      value: 87,
      caption: "9 of 10 workstreams complete",
    },
    agents: {
      title: "DD agents",
      items: [
        { name: "Finance", status: "done" as const, count: 38 },
        { name: "Legal", status: "done" as const, count: 24 },
        { name: "Commercial", status: "running" as const, count: 19 },
        { name: "HR", status: "done" as const, count: 11 },
        { name: "IT", status: "running" as const, count: 7 },
      ],
    },
    actions: {
      primary: "Generate IC memo",
      secondary: "Export",
    },
  },
  icMemo: {
    title: "IC Memo — Helios AgriTech",
    subtitle: "Draft v2 · Updated 2 minutes ago",
    badge: "Decision-ready",
    sections: [
      {
        id: "01",
        title: "Investment thesis",
        body:
          "Vertically integrated agri-tech with EBITDA expanding " +
          "18% YoY. Defensible position in EU specialty crops.",
        citation: "Pitch deck · p.4",
      },
      {
        id: "02",
        title: "Financial snapshot",
        body:
          "Revenue €31.0M, EBITDA €4.2M (13.5% margin), Net Debt " +
          "€14.3M, growth +18% YoY.",
        citation: "P&L 2024.pdf · p.04",
      },
      {
        id: "03",
        title: "Customer concentration risk",
        body:
          "Top-3 = 64% of revenue. Retention >92% over 5 years " +
          "but renewal cycle Q4 2026.",
        citation: "Annexe-3.xlsx · p.12",
      },
    ],
    questions: {
      title: "Open management questions",
      items: [
        "Renewal probability of top customer for FY26?",
        "How will the €2.1M EBITDA bridge be funded post-deal?",
        "Litigation disclosed in latest data room update?",
      ],
    },
  },
  trustedBy: {
    label: "Built for PE deal teams investing in",
    logos: ["Services", "Healthcare", "Energy", "Agriculture"],
    cookies: {
      message:
        "We use cookies to personalize content and analyze " +
        "platform usage.",
      cta: "Okay",
    },
  },
  products: {
    title: "Replace days of analyst grunt work",
    cards: [
      {
        tag: "Live now",
        title: "AI Due Diligence",
        description:
          "Upload a data room. Get sourced red flags, management " +
          "questions and a draft IC memo with citations — in 30 minutes.",
        cta: "See it run",
        visual: {
          kind: "recording" as const,
          label: "Analyzing 247 documents...",
        },
      },
      {
        tag: "Coming soon",
        title: "Lead Sourcing & Outreach",
        description:
          "Score targets against your investment thesis, enrich " +
          "with financials, and trigger outreach — wired to your CRM.",
        cta: "Join waitlist",
        visual: {
          kind: "performance" as const,
          heading: "Pipeline coverage",
          value: "94%",
          period: "Thesis-aligned targets surfaced",
          rows: [
            {
              label: "Sourced",
              current: "1,284",
              target: "Q3",
              trade: "+312",
            },
            {
              label: "Qualified",
              current: "184",
              target: "≥7.0",
              trade: "+42",
            },
            {
              label: "In DD",
              current: "12",
              target: "live",
              trade: "+3",
            },
          ],
        },
      },
    ],
  },
  pipeline: {
    title: "From lead to IC decision\nin one workflow",
    subtitle:
      "End-to-end automation with human checkpoints where it " +
      "matters most.",
    stages: [
      {
        id: "01",
        title: "Lead Sourcing",
        body:
          "Scraping and ingestion across deal networks, brokers " +
          "and public registries.",
        coverage: "100%",
      },
      {
        id: "02",
        title: "Enrichment",
        body:
          "Financials, headcount, ownership and intent signals " +
          "layered onto every target.",
        coverage: "100%",
      },
      {
        id: "03",
        title: "Thesis Scoring",
        body:
          "Each target ranked against your fund's mandate and " +
          "investment thesis.",
        coverage: "100%",
      },
      {
        id: "04",
        title: "Outreach",
        body:
          "Personalized intros, replies and meeting scheduling — " +
          "your tone, your CRM.",
        coverage: "85%",
      },
      {
        id: "05",
        title: "Virtual Data Room",
        body:
          "Secure upload with RBAC. Documents auto-categorized " +
          "on ingest.",
        coverage: "100%",
      },
      {
        id: "06",
        title: "Due Diligence Agents",
        body:
          "Specialized agents for finance, legal, commercial, HR " +
          "and IT workstreams.",
        coverage: "92%",
      },
      {
        id: "07",
        title: "Risk Engine",
        body:
          "Sourced red and green flags with severity scoring " +
          "across every workstream.",
        coverage: "92%",
      },
      {
        id: "08",
        title: "Human Review",
        body:
          "Analysts validate, comment and override before " +
          "anything ships to the IC.",
        coverage: "Human",
      },
      {
        id: "09",
        title: "IC Memo",
        body:
          "Decision-ready memo with citations, charts and a " +
          "management Q&A appendix.",
        coverage: "100%",
      },
    ],
  },
  platform: {
    title: "The deal workspace\nfor lean PE teams",
    column: {
      heading: "Lower-mid-market PE",
      lead:
        "Small teams, manual workflows. The biggest efficiency " +
        "wins are right here.",
      sectionTitle: "Deal workspace",
      body:
        "A shared cockpit for the deal team. Every analyst, " +
        "every memo, every red flag — sourced, versioned and " +
        "exportable.",
      features: [
        "Upload data room",
        "AI extraction & analysis",
        "Sourced red flags",
        "Management questions",
        "Exportable IC memo",
      ],
      footer: "First-pass DD in 30 minutes instead of 5 days.",
    },
  },
  features: {
    title: "Decision-grade output",
    subtitle:
      "Not summaries. A PE-grade memo with a traceable source " +
      "on every claim.",
    items: [
      {
        title: "Deal thesis",
        coverage: "100%",
        body:
          "Pre-filled from your fund's mandate and the target's " +
          "profile.",
      },
      {
        title: "Financial snapshot",
        coverage: "100%",
        body:
          "Revenue, EBITDA, debt and growth normalized across " +
          "reporting years.",
      },
      {
        title: "EBITDA adjustments",
        coverage: "95%",
        body:
          "One-offs, run-rate and pro-forma bridges with " +
          "footnoted sources.",
      },
      {
        title: "Customer concentration",
        coverage: "100%",
        body:
          "Top-N exposure and contract duration risk by client " +
          "and segment.",
      },
      {
        title: "Debt & covenant risks",
        coverage: "92%",
        body:
          "Maturity walls, headroom analysis and covenant " +
          "breaches with citations.",
      },
      {
        title: "Quality of earnings",
        coverage: "90%",
        body:
          "Flags on revenue recognition, working capital and " +
          "cash conversion.",
      },
      {
        title: "Commercial DD questions",
        coverage: "85%",
        body:
          "Targeted questions ready to send to commercial " +
          "advisors and management.",
      },
      {
        title: "Legal red flags",
        coverage: "88%",
        body:
          "Risky clauses, litigation exposure, IP and ownership " +
          "issues surfaced.",
      },
      {
        title: "Management questions",
        coverage: "100%",
        body:
          "Sharp, sourced questions ready for the next " +
          "management meeting.",
      },
    ],
  },
  consolidators: {
    title: "Scale across funds",
    chartCard: {
      label: "Helios AgriTech",
      tag: "DD ready",
      pill: "Open IC memo",
      metricLabel: "Severity",
      metricValue: "Medium",
      caption: "12 red flags · 47 cited sources",
    },
    column: {
      heading: "Multi-fund consolidators",
      sectionTitle: "Portfolio-wide oversight",
      body:
        "Run multiple funds and deal teams under one workspace " +
        "with consolidated reporting, audit trails and access " +
        "controls.",
      features: [
        "Cross-fund deal pipeline",
        "Document categorization",
        "Severity scoring",
        "Role-based access",
        "Audit logs",
        "Custom investment thesis",
      ],
      footer:
        "Everything for single funds — across your whole platform.",
    },
  },
  regulated: {
    title: "Built for regulated\ncapital",
    items: [
      {
        title: "Sourced on every line",
        body:
          "Every claim cites the underlying document, page and " +
          "clause.",
      },
      {
        title: "Secure by default",
        body:
          "RBAC, SSO and encrypted virtual data rooms hosted in " +
          "the EU.",
      },
      {
        title: "Audit-ready logs",
        body:
          "Every action, every export, every override is " +
          "traceable.",
      },
    ],
  },
  footer: {
    disclaimer:
      "Athena Technologies Limited builds AI tooling for " +
      "private equity deal teams. Athena is not a regulated " +
      "investment adviser; outputs are decision-support " +
      "artefacts and do not constitute financial advice.",
    powered: "Built with",
    poweredBy: "RockCore",
    columns: [
      {
        heading: "Product",
        items: [
          "AI Due Diligence",
          "Lead Sourcing",
          "Virtual Data Room",
        ],
      },
      {
        heading: "Athena",
        items: [
          "About",
          "Customers",
          "Careers",
          "Contact",
          "LinkedIn",
        ],
      },
      {
        heading: "Trust",
        items: [
          "Privacy Policy",
          "Terms of Service",
          "Security",
        ],
      },
    ],
    copyright:
      "© 2025 Athena Technologies Limited. All other " +
      "registered trademarks are property of their respective " +
      "owners.",
    address:
      "Athena Technologies Limited, registered in England & " +
      "Wales. Office: 86 Mercer Street, London, England, " +
      "WC2H 9HD.",
    wordmark: "Athena",
  },
} as const;

export type LandingContent = typeof landingContent;
