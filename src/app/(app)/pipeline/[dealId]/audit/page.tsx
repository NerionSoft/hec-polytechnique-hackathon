import { notFound } from "next/navigation";
import { Bot, Download } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { team } from "@/src/lib/mock/fund";
import { findPipelineDeal, listPipelineAudit } from "@/src/lib/data/pipeline";
import { PageHeader } from "../../../_components/PageHeader";
import { AuditAutoRefresh } from "./_components/AuditAutoRefresh";

// While a pipeline run is in flight, audit events arrive every few seconds.
// Disabling the static cache lets the auto-refresh client component pick up
// fresh server data on every poll without us needing a route revalidation.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = await findPipelineDeal(dealId);
  if (!deal) notFound();
  const entries = await listPipelineAudit(dealId);

  return (
    <>
      <PageHeader
        title="Audit Log"
        description={`${entries.length} entries · all AI inferences and human overrides time-stamped`}
        action={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full",
              "border-foreground/[0.10] border px-3 py-1.5",
              "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground text-[12px]",
            )}
          >
            <Download strokeWidth={1.6} className="size-3.5" />
            Export CSV
          </button>
        }
      />

      <AuditAutoRefresh entryCount={entries.length} />

      <div className="px-8 pb-12">
        <ol
          className={cn(
            "border-foreground/[0.08] relative flex flex-col gap-4 rounded-[18px] border",
            "bg-surface/60 p-6",
          )}
        >
          <span className="bg-foreground/[0.08] absolute top-6 bottom-6 left-[34px] w-px" />
          {entries.map((entry) => {
            const member = entry.actor !== "ai" ? team.find((t) => t.id === entry.actor) : null;
            const isError =
              entry.action.endsWith("_failed") || entry.action.startsWith("ingest_failed");
            return (
              <li key={entry.id} className="relative flex items-start gap-4">
                {entry.actor === "ai" ? (
                  <span
                    className={cn(
                      "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border",
                      isError
                        ? "border-sev-crit/30 bg-sev-crit/10 text-sev-crit"
                        : "border-state-ai/25 bg-state-ai/10 text-state-ai",
                    )}
                  >
                    <Bot strokeWidth={1.8} className="size-3.5" />
                  </span>
                ) : member ? (
                  <span
                    className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-medium text-white"
                    style={{ background: `hsl(${member.avatarHue} 60% 35%)` }}
                  >
                    {member.initials}
                  </span>
                ) : null}
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-foreground/85 text-[13px]">
                    <span className="text-foreground font-medium">
                      {entry.actor === "ai" ? "AI agent" : member?.name}
                    </span>{" "}
                    <span className={isError ? "text-sev-crit" : "text-foreground/55"}>
                      {entry.action}
                    </span>{" "}
                    <span className="break-all">{entry.target}</span>
                    {entry.durationMs != null && (
                      <span className="text-foreground/35 tabular ml-1 text-[11px]">
                        ({(entry.durationMs / 1000).toFixed(1)}s)
                      </span>
                    )}
                  </p>
                  {entry.detail && (
                    <p
                      className={cn(
                        "mt-1 rounded-[8px] border px-2.5 py-1.5 text-[11.5px] leading-relaxed break-words",
                        isError
                          ? "border-sev-crit/25 bg-sev-crit/5 text-sev-crit/90 font-mono"
                          : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/65",
                      )}
                    >
                      {entry.detail}
                    </p>
                  )}
                  <p className="text-foreground/45 mt-0.5 text-[11px]">
                    {new Date(entry.timestamp).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
