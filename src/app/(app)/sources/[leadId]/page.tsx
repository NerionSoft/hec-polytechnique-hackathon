import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { getSession } from "@/src/infrastructure/auth/server";
import { getUseCases } from "@/src/infrastructure/composition";
import { getSelectedThesisId } from "@/src/infrastructure/http/selectedThesis";
import { DecisionBadge } from "@/src/presentation/components/leads/DecisionPill";
import {
  MethodologyDrawer,
  type LeadEvidence,
} from "@/src/presentation/components/methodology/MethodologyDrawer";
import type { LeadId } from "@/src/application/domain/lead/Lead";
import { getCountry } from "@/src/application/reference/countries";
import { getNafDivision } from "@/src/application/reference/naf";
import { LeadActions } from "./_components/LeadActions";
import { OutreachPanel, type OutreachDraftDto } from "./_components/OutreachPanel";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const session = await getSession(await headers());
  if (!session) redirect("/sign-in");

  const { leadId } = await params;
  const useCases = getUseCases();
  const id = leadId as LeadId;

  const [lead, enrichment, score] = await Promise.all([
    useCases.getLeadById(id),
    useCases.enrichmentRepo.findByLeadId(id),
    useCases.scoreRepo.findByLeadId(id),
  ]);
  if (!lead) notFound();

  const j = lead.toJSON();

  // Authorization: leads are scoped via thesis ownership.
  let leadThesisName: string | null = null;
  if (j.thesisId) {
    const t = await useCases.getThesisById({ ownerId: session.user.id, id: j.thesisId });
    if (!t) notFound();
    leadThesisName = t.name;
  } else {
    notFound();
  }

  const selectedThesisId = await getSelectedThesisId(session.user.id);
  const country = getCountry(j.country);
  const nafDivision = j.napCode ? getNafDivision(j.napCode.slice(0, 2)) : null;
  const snapshot = j.website ? await useCases.snapshotCache.get(j.website) : null;

  const outreachDrafts = await useCases.listOutreachDrafts({
    ownerId: session.user.id,
    leadId: id,
  });
  const outreachDtos: OutreachDraftDto[] = outreachDrafts.map((d) => {
    const j = d.toJSON();
    return {
      id: j.id,
      leadId: j.leadId,
      thesisId: j.thesisId,
      recipient: j.recipient,
      subject: j.subject,
      body: j.body,
      status: j.status,
      model: j.model,
      promptHash: j.promptHash,
      generatedAt: j.generatedAt.toISOString(),
      approvedAt: j.approvedAt ? j.approvedAt.toISOString() : null,
      sentAt: j.sentAt ? j.sentAt.toISOString() : null,
      updatedAt: j.updatedAt.toISOString(),
    };
  });

  const evidence: LeadEvidence = {
    source: j.source,
    sourceRef: j.sourceRef,
    website: j.website,
    websiteSnapshot: snapshot
      ? {
          fetchedAt: snapshot.fetchedAt.toISOString(),
          title: snapshot.title,
        }
      : null,
    enrichmentModel: enrichment?.model ?? null,
    enrichmentPromptHash: enrichment?.promptHash ?? null,
    enrichmentUpdatedAt: enrichment?.updatedAt.toISOString() ?? null,
    scoreReasons: score?.reasons ?? null,
    scoreMissingInfo: score?.missingInfo ?? null,
    scoreThesisId: score?.thesisId ?? null,
    thesisName: leadThesisName,
  };

  return (
    <div className="px-8 pb-12">
      <div className="pt-6">
        <Link
          href="/sources"
          className={cn(
            "text-foreground/55 inline-flex items-center gap-1 text-[12px]",
            "hover:text-foreground transition-colors",
          )}
        >
          <ChevronLeft strokeWidth={1.6} className="size-3.5" />
          Sources
        </Link>
      </div>

      <header className="mt-3 flex items-start justify-between gap-6 pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[34px] leading-[1.05] tracking-tight">{j.companyName}</h1>
          <p className="text-foreground/55 mt-1 text-[13px]">
            {country?.label ?? j.country}
            {nafDivision && (
              <>
                {" · "}
                <span className="tabular text-foreground/45">{nafDivision.code}</span>{" "}
                {nafDivision.label}
              </>
            )}
            {!nafDivision && j.sector && ` · ${j.sector}`}
            {j.employeeCount != null && ` · ${j.employeeCount} employees`}
          </p>
          <div className="text-foreground/55 mt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="bg-foreground/[0.06] rounded-full px-2 py-0.5 tracking-[0.10em] uppercase">
              {j.source}
            </span>
            {j.sourceRef && (
              <span className="tabular">
                {j.source === "SIRENE" ? "SIREN " : "ref "}
                {j.sourceRef}
              </span>
            )}
            {j.website && (
              <a
                href={j.website}
                target="_blank"
                rel="noreferrer"
                className="text-foreground/65 inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
              >
                {j.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink strokeWidth={1.6} className="size-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LeadActions
            leadId={j.id}
            thesisId={selectedThesisId}
            hasEnrichment={!!enrichment}
            hasScore={!!score}
          />
          <MethodologyDrawer evidence={evidence} triggerLabel="Sources & methodology" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <ScoreSection score={score} />
          <EnrichmentSection enrichment={enrichment} />
          <OutreachPanel
            leadId={j.id}
            thesisId={j.thesisId}
            hasEnrichment={!!enrichment}
            initialDrafts={outreachDtos}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <FactsCard lead={j} />
        </aside>
      </div>
    </div>
  );
}

function ScoreSection({
  score,
}: {
  score: {
    score: number;
    decision: "REJECT" | "WATCHLIST" | "OUTREACH";
    reasons: string[];
    missingInfo: string[];
  } | null;
}) {
  if (!score) {
    return (
      <section
        className={cn(
          "border-foreground/15 bg-surface/40 rounded-[20px] border border-dashed p-6",
          "text-foreground/55 text-[12.5px]",
        )}
      >
        Run “Score against thesis” to evaluate this lead with the deterministic 8-rule engine.
        Requires enrichment first.
      </section>
    );
  }
  return (
    <section className={cn("border-foreground/[0.08] bg-surface/60 rounded-[20px] border p-6")}>
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
            Deterministic thesis fit · 8 rules / 100 pts
          </p>
          <DecisionBadge decision={score.decision} />
        </div>
        <p className="tabular font-serif text-[44px] leading-none tracking-tight">
          {score.score} <span className="text-foreground/45 text-[16px]">/ 100</span>
        </p>
      </div>

      <ul className="text-foreground/85 flex flex-col gap-1.5 text-[12.5px] leading-relaxed">
        {score.reasons.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="bg-foreground/35 mt-1.5 size-1 shrink-0 rounded-full" />
            <span>{r}</span>
          </li>
        ))}
      </ul>

      {score.missingInfo.length > 0 && (
        <div className="border-warm/25 bg-warm/[0.04] mt-4 rounded-[12px] border px-3 py-2">
          <p className="text-warm text-[10.5px] tracking-[0.14em] uppercase">Missing information</p>
          <ul className="text-foreground/85 mt-1 flex flex-col gap-1 text-[12px]">
            {score.missingInfo.map((m, i) => (
              <li key={i}>· {m}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EnrichmentSection({
  enrichment,
}: {
  enrichment: {
    businessSummary: string;
    investmentRationale: string[];
    concerns: string[];
    suggestedOutreachAngle: string | null;
    peFitScore: number;
    peFitDecision: "REJECT" | "WATCHLIST" | "OUTREACH";
    model: string;
    promptHash: string;
    updatedAt: Date;
  } | null;
}) {
  if (!enrichment) {
    return (
      <section
        className={cn(
          "border-foreground/15 bg-surface/40 rounded-[20px] border border-dashed p-6",
          "text-foreground/55 text-[12.5px]",
        )}
      >
        Click “Enrich” to scrape the company website (robots.txt aware) and call the LLM enricher.
        Cached by URL and prompt hash.
      </section>
    );
  }
  return (
    <section className="border-foreground/[0.08] bg-surface/60 rounded-[20px] border p-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
          LLM enrichment · {enrichment.model}
        </p>
        <span className="tabular text-foreground/35 text-[10.5px]">
          prompt {enrichment.promptHash.slice(0, 12)}…
        </span>
      </div>
      <p className="text-foreground/85 text-[13px] leading-relaxed">{enrichment.businessSummary}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Box title="Investment rationale" tone="good" items={enrichment.investmentRationale} />
        <Box title="Concerns" tone="warm" items={enrichment.concerns} />
      </div>

      {enrichment.suggestedOutreachAngle && (
        <div className="border-foreground/[0.10] bg-foreground/[0.03] mt-4 rounded-[12px] border p-3">
          <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
            Suggested outreach angle
          </p>
          <p className="text-foreground/85 mt-1 text-[12.5px] italic">
            “{enrichment.suggestedOutreachAngle}”
          </p>
        </div>
      )}

      <p className="text-foreground/45 mt-4 text-[10.5px]">
        LLM PE-fit score (advisory): {enrichment.peFitScore} ({enrichment.peFitDecision}). Persisted
        from {enrichment.model}, refreshed {enrichment.updatedAt.toISOString()}.
      </p>
    </section>
  );
}

function Box({ title, tone, items }: { title: string; tone: "good" | "warm"; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "rounded-[12px] border px-3 py-2",
        tone === "good" ? "border-sev-low/25 bg-sev-low/[0.04]" : "border-warm/25 bg-warm/[0.04]",
      )}
    >
      <p
        className={cn(
          "text-[10.5px] tracking-[0.14em] uppercase",
          tone === "good" ? "text-sev-low" : "text-warm",
        )}
      >
        {title}
      </p>
      <ul className="text-foreground/85 mt-1 flex flex-col gap-1 text-[12px]">
        {items.map((it, i) => (
          <li key={i}>· {it}</li>
        ))}
      </ul>
    </div>
  );
}

function FactsCard({
  lead,
}: {
  lead: {
    companyName: string;
    legalName: string | null;
    website: string | null;
    country: string;
    sector: string | null;
    napCode: string | null;
    employeeCount: number | null;
    estimatedRevenueEur: number | null;
    founderName: string | null;
    status: string;
    createdAt: Date;
  };
}) {
  return (
    <section
      className={cn(
        "border-foreground/[0.08] flex flex-col gap-3 rounded-[20px] border",
        "bg-surface/60 p-5",
      )}
    >
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">Identification</p>
      <Field label="Legal name" value={lead.legalName ?? "—"} />
      <Field label="Country" value={lead.country} />
      <Field label="NAF code" value={lead.napCode ?? "—"} />
      <Field
        label="Employees"
        value={lead.employeeCount != null ? String(lead.employeeCount) : "—"}
      />
      <Field
        label="Revenue"
        value={
          lead.estimatedRevenueEur != null
            ? `€${(lead.estimatedRevenueEur / 1_000_000).toFixed(1)}M`
            : "—"
        }
      />
      <Field label="Founder" value={lead.founderName ?? "—"} />
      <Field label="Status" value={lead.status.toLowerCase().replaceAll("_", " ")} />
      <Field label="Imported" value={lead.createdAt.toISOString().slice(0, 10)} />
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-foreground/[0.06] flex items-baseline justify-between gap-3 border-t pt-2 first:border-0 first:pt-0">
      <span className="text-foreground/55 text-[11.5px]">{label}</span>
      <span className="text-foreground text-right text-[12.5px] font-medium">{value}</span>
    </div>
  );
}
