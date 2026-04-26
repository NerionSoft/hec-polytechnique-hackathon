"use client";

import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

export interface LeadEvidence {
  source: string;
  sourceRef: string | null;
  website: string | null;
  websiteDiscovery: {
    source: string; // e.g. "duckduckgo"
    rationale: string;
  } | null;
  websiteSnapshot: {
    fetchedAt: string;
    title: string | null;
  } | null;
  enrichmentModel: string | null;
  enrichmentPromptHash: string | null;
  enrichmentUpdatedAt: string | null;
  scoreReasons: string[] | null;
  scoreMissingInfo: string[] | null;
  scoreThesisId: string | null;
  thesisName: string | null;
}

interface Props {
  evidence?: LeadEvidence;
  triggerLabel?: string;
  className?: string;
}

const SCORING_RULES: Array<{
  rule: string;
  points: number;
  fires: string;
  skipIf: string;
  missingIf: string;
}> = [
  {
    rule: "Sector match",
    points: 20,
    fires:
      "Lead.sector matches one of thesis.sectors (case-insensitive equality OR prefix — e.g. NAF division 62 fits 6201Z).",
    skipIf: "thesis.sectors is empty (permissive thesis) — no points awarded, no penalty.",
    missingIf: "Lead.sector is unknown.",
  },
  {
    rule: "Size band",
    points: 15,
    fires:
      "Lead.estimatedRevenueEur ∈ [thesis.minRevenueEur, thesis.maxRevenueEur]. If revenue is missing, falls back to employeeCount ∈ [10, 250] (SME proxy).",
    skipIf: "Both estimatedRevenueEur AND employeeCount are unknown.",
    missingIf: "Both unknown → flagged in missingInfo.",
  },
  {
    rule: "Founder-owned",
    points: 15,
    fires: "thesis.preferences.founderOwned = true AND Lead.founderName is non-empty.",
    skipIf:
      "thesis.preferences.founderOwned is undefined or false → rule not evaluated, no penalty.",
    missingIf: "Preference is true but founderName is unknown.",
  },
  {
    rule: "Recurring revenue",
    points: 10,
    fires:
      "Keyword regex on (businessSummary + investmentRationale + concerns): SaaS, abonnement, subscription, MRR, ARR, recurring, récurrent, multi-year contract.",
    skipIf: "No keyword + thesis.preferences.recurringRevenue not true.",
    missingIf: "Thesis prefers it but no keyword evidence.",
  },
  {
    rule: "Profitable / mature",
    points: 10,
    fires:
      "Keyword: profitable, rentable, EBITDA-positive, cash-flow positive, bénéficiaire, mature.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
  {
    rule: "Fragmented market / buy-and-build",
    points: 10,
    fires:
      "Keyword: fragmented, buy-and-build, build-up, consolidation, roll-up, marché fragmenté.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
  {
    rule: "Succession / founder-dependency",
    points: 10,
    fires:
      "Keyword: succession, fondateur-dépendant, founder dependency, key-person risk, transmission, cédant.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
  {
    rule: "Low competition / niche",
    points: 10,
    fires:
      "Keyword: low competition, peu de concurrence, niche, defensible moat, barriers to entry.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
];

const THRESHOLDS = [
  { decision: "REJECT", range: "score < 40", tone: "bg-sev-crit/15 text-sev-crit" },
  { decision: "WATCHLIST", range: "40 ≤ score < 70", tone: "bg-sev-med/15 text-sev-med" },
  { decision: "OUTREACH", range: "score ≥ 70", tone: "bg-sev-low/15 text-sev-low" },
];

export function MethodologyDrawer({
  evidence,
  triggerLabel = "Methodology & sources",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full",
          "border-foreground/[0.10] border px-3 py-1.5",
          "text-foreground/70 text-[12px] transition-colors",
          "hover:bg-foreground/[0.06] hover:text-foreground",
          className,
        )}
      >
        <BookOpen strokeWidth={1.6} className="size-3.5" />
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside
            className={cn(
              "relative ml-auto flex h-full w-full max-w-[640px] flex-col",
              "border-foreground/[0.08] bg-background border-l",
              "shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]",
            )}
            role="dialog"
            aria-modal="true"
          >
            <header
              className={cn(
                "flex items-center justify-between gap-3",
                "border-foreground/[0.08] border-b px-5 py-3.5",
              )}
            >
              <h2 className="font-serif text-[18px] tracking-tight">Methodology & sources</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  "text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground",
                )}
              >
                <X strokeWidth={1.6} className="size-4" />
              </button>
            </header>
            <div className="text-foreground/85 flex-1 overflow-y-auto px-5 py-5 text-[12.5px] leading-relaxed">
              {evidence && <EvidenceBlock evidence={evidence} />}
              <GenericBlock />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function EvidenceBlock({ evidence }: { evidence: LeadEvidence }) {
  return (
    <section
      className={cn(
        "border-foreground/[0.10] mb-6 rounded-[14px] border",
        "bg-foreground/[0.03] p-4",
      )}
    >
      <h3 className="mb-2 text-[13px] font-medium">Evidence trail for this lead</h3>
      <Field
        label="Origin"
        value={evidence.sourceRef ? `${evidence.source} · ${evidence.sourceRef}` : evidence.source}
      />
      {evidence.website && <Field label="Website" value={evidence.website} />}
      {evidence.websiteDiscovery && (
        <Field
          label="Discovered via"
          value={`${evidence.websiteDiscovery.source} — ${evidence.websiteDiscovery.rationale}`}
        />
      )}
      {evidence.websiteSnapshot && (
        <Field
          label="Snapshot"
          value={`${evidence.websiteSnapshot.title ?? "(no title)"} · scraped ${evidence.websiteSnapshot.fetchedAt}`}
        />
      )}
      {evidence.enrichmentModel ? (
        <>
          <Field label="LLM model" value={evidence.enrichmentModel} />
          <Field
            label="Prompt hash"
            value={`${evidence.enrichmentPromptHash?.slice(0, 16) ?? "?"}…`}
          />
          <Field label="Enriched at" value={evidence.enrichmentUpdatedAt ?? "—"} />
        </>
      ) : (
        <p className="text-foreground/55 mt-2 text-[11.5px]">
          No enrichment yet — run “Enrich” to scrape & call the LLM.
        </p>
      )}
      {evidence.scoreThesisId && (
        <Field label="Scored vs" value={evidence.thesisName ?? evidence.scoreThesisId} />
      )}
      {evidence.scoreReasons && evidence.scoreReasons.length > 0 && (
        <details className="mt-2">
          <summary className="text-foreground/65 cursor-pointer text-[11.5px]">
            ▸ {evidence.scoreReasons.length} scoring decisions
          </summary>
          <ul className="text-foreground/75 mt-1 flex flex-col gap-0.5 pl-4 text-[11.5px]">
            {evidence.scoreReasons.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </details>
      )}
      {evidence.scoreMissingInfo && evidence.scoreMissingInfo.length > 0 && (
        <details className="mt-1">
          <summary className="text-warm cursor-pointer text-[11.5px]">
            ▸ {evidence.scoreMissingInfo.length} missing-information flags
          </summary>
          <ul className="text-foreground/75 mt-1 flex flex-col gap-0.5 pl-4 text-[11.5px]">
            {evidence.scoreMissingInfo.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-1 grid grid-cols-[110px_1fr] items-baseline gap-2">
      <span className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</span>
      <span className="text-foreground/85 text-[12px] break-all">{value}</span>
    </div>
  );
}

function GenericBlock() {
  return (
    <>
      <H>1. Lead sources (real, no mocks)</H>
      <ul className="ml-5 list-disc">
        <li>
          <strong>Sirene</strong> — French government open API{" "}
          <Code>recherche-entreprises.api.gouv.fr</Code>. No auth, ~7 req/s. Filters: NAF rév. 2
          division (88 codes), code postal (départements), tranche d&apos;effectif (16 INSEE codes),
          forme juridique (INSEE catégorie juridique). Returns SIREN, raison sociale, NAF, tranche
          d&apos;effectif, dirigeants, headquarters address. Pagination capped at 25/page.
        </li>
        <li>
          <strong>CSV import</strong> — multipart upload. Original file persisted on{" "}
          <strong>Vercel Blob</strong> (audit trail). Auto-detects comma vs semicolon (French
          Excel). Header aliases supported: <Code>Effectif</Code> → <Code>employeeCount</Code>,{" "}
          <Code>CA</Code> → <Code>estimatedRevenueEur</Code>, <Code>Fondateur</Code> →{" "}
          <Code>founderName</Code>.
        </li>
        <li>
          All leads dedupe on (<Code>source</Code>, <Code>sourceRef</Code>) — re-sourcing the same
          SIREN updates the existing row.
        </li>
      </ul>

      <H>2. Enrichment pipeline (per lead)</H>
      <ol className="ml-5 list-decimal">
        <li>
          <strong>Website snapshot</strong> — if <Code>lead.website</Code> is set, the URL is
          checked against the persistent <Code>WebsiteSnapshot</Code> cache. On miss: Cheerio fetch
          with User-Agent <Code>Athena-DealProof/0.1</Code>, robots.txt fail-closed on disallow, 8s
          timeout, 1.5MB body cap. Extracts <Code>&lt;title&gt;</Code>,{" "}
          <Code>meta[name=description]</Code>, <Code>h1</Code>/<Code>h2</Code> headings, contact
          emails, social links.
        </li>
        <li>
          <strong>LLM enrichment</strong> — Lead fields + scraped snapshot are formatted into a user
          prompt and sent to <Code>google/gemini-3-flash</Code> via{" "}
          <strong>Vercel AI Gateway</strong>. Output is constrained by a Zod schema. Temperature
          0.2, max 2 retries. Cost guard aborts if user prompt &gt; 20k chars.
        </li>
        <li>
          <strong>Idempotency cache</strong> — SHA-256(system prompt + user prompt + model + schema
          version) is the primary key. Identical inputs return the cached enrichment with zero token
          cost.
        </li>
      </ol>

      <H>3. Two complementary scores per lead</H>
      <ul className="ml-5 list-disc">
        <li>
          <strong>LLM PE-fit</strong> — Gemini&apos;s holistic 0-100 judgment. Narrative-aware,
          non-deterministic, advisory only.
        </li>
        <li>
          <strong>Rule-based score</strong> — pure deterministic function over the LLM output and
          the active thesis. Audit-friendly. The LLM&apos;s peFitScore is <em>ignored</em> here —
          the rule-based score is an audit on top of the narrative, not a multiplier of it.
        </li>
      </ul>

      <H>4. Rule-based scoring (8 rules, 100 pts max)</H>
      <div className="border-foreground/[0.08] overflow-x-auto rounded-[10px] border">
        <table className="w-full border-collapse text-[11.5px]">
          <thead className="bg-foreground/[0.04]">
            <tr>
              <Th>Rule</Th>
              <Th className="w-[42px] text-center">Pts</Th>
              <Th>Fires when</Th>
              <Th>Skipped when</Th>
              <Th>Missing info when</Th>
            </tr>
          </thead>
          <tbody>
            {SCORING_RULES.map((r) => (
              <tr key={r.rule} className="border-foreground/[0.06] border-t">
                <Td>
                  <strong>{r.rule}</strong>
                </Td>
                <Td className="text-center font-medium">+{r.points}</Td>
                <Td>{r.fires}</Td>
                <Td>{r.skipIf}</Td>
                <Td>{r.missingIf}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H>5. Decision thresholds</H>
      <div className="flex flex-wrap gap-1.5">
        {THRESHOLDS.map((t) => (
          <span
            key={t.decision}
            className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", t.tone)}
          >
            {t.decision} — {t.range}
          </span>
        ))}
      </div>
      <p className="text-foreground/55 mt-2 text-[11.5px]">
        Threshold of 70 (not 60) for OUTREACH is intentional: the rubric maxes at 100, and 70
        requires roughly 4-5 distinct positive signals. 60 would let a deal pass on sector + size +
        a single keyword — too noisy for an analyst-time decision.
      </p>

      <H>6. Special handling</H>
      <ul className="ml-5 list-disc">
        <li>
          <strong>Country mismatch</strong> — outside thesis: no points deducted,{" "}
          <Code>countryOutsideThesis</Code> added to <Code>missingInfo</Code>.
        </li>
        <li>
          <strong>Score cap</strong> — clamped to <Code>[0, 100]</Code>.
        </li>
        <li>
          <strong>Permissive thesis</strong> — empty <Code>sectors</Code> / <Code>countries</Code> /
          no preferences: rules silently skip.
        </li>
        <li>
          <strong>No re-scrape</strong> — once a website snapshot is cached, repeated enrichments
          skip the network fetch.
        </li>
      </ul>

      <p className="text-foreground/45 mt-4 text-[11px]">
        Source files: <Code>src/application/use-cases/leads/scoringEngine.ts</Code> ·{" "}
        <Code>src/infrastructure/llm/ai-gateway/AiGatewayLeadEnricher.ts</Code> ·{" "}
        <Code>src/infrastructure/sources/sirene/SireneCompanyDataSource.ts</Code> ·{" "}
        <Code>src/infrastructure/scraping/cheerio/CheerioWebsiteScraper.ts</Code>.
      </p>
    </>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="text-foreground mt-4 mb-2 text-[14px] font-medium">{children}</h3>;
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-foreground/[0.06] tabular text-foreground/85 rounded px-1 py-0.5 text-[11px]">
      {children}
    </code>
  );
}
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "text-foreground/45 px-2 py-1.5 text-left text-[10.5px] tracking-[0.10em] uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("text-foreground/85 px-2 py-1.5 align-top", className)}>{children}</td>;
}
