import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { team } from "@/src/lib/mock/fund";
import { findPipelineDeal, findPipelineMemo } from "@/src/lib/data/pipeline";
import { PageHeader } from "../../../_components/PageHeader";
import { CitationLink } from "../_components/CitationLink";
import { ExportMemoButton } from "./_components/ExportMemoButton";
import { formatRelativeDate } from "@/src/lib/utils";

const RF_REFS: Record<string, { citation: string; title: string }> = {
  rf1: { citation: "c5", title: "NordPlast change-of-control" },
  rf2: { citation: "c3", title: "Customer concentration" },
  rf3: { citation: "c2", title: "EBITDA add-backs" },
  rf4: { citation: "c4", title: "Covenant headroom" },
};

export default async function MemoPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = await findPipelineDeal(dealId);
  if (!deal) notFound();
  const memo = await findPipelineMemo(dealId);
  if (!memo) {
    return (
      <>
        <PageHeader
          title="IC Memo"
          description="Memo not yet drafted — kick off a pipeline run to generate one."
        />
        <div className="px-4 pb-12 sm:px-8">
          <div
            className={cn(
              "border-foreground/[0.10] mx-auto max-w-[760px] rounded-[24px]",
              "bg-foreground/[0.02] border border-dashed p-10 text-center",
            )}
          >
            <p className="font-serif text-[20px]">No memo for this deal yet</p>
            <p className="text-foreground/55 mt-1 text-[12.5px]">
              The memo is produced by the synthesis agent at the end of a successful run.
            </p>
          </div>
        </div>
      </>
    );
  }
  const editor = team.find((t) => t.id === memo.lastEditedBy);

  return (
    <>
      <PageHeader
        title="IC Memo"
        description={`Status: ${memo.status} · ${Math.round(memo.reviewProgress * 100)}% reviewed · ${memo.pendingItems} items pending · last edit by ${editor?.name} ${formatRelativeDate(memo.lastEditedAt)}`}
        action={<ExportMemoButton dealId={dealId} />}
      />

      <div className="px-4 pb-12 sm:px-8">
        <div
          className={cn(
            "border-foreground/[0.08] mx-auto max-w-[760px] rounded-[24px] border",
            "bg-surface/50 p-10",
          )}
        >
          <div className="border-foreground/[0.08] mb-8 flex items-center gap-2 border-b pb-4">
            <Sparkles strokeWidth={1.6} className="text-warm size-4" />
            <p className="text-foreground/55 text-[10.5px] tracking-[0.14em] uppercase">
              Investment Committee Memo · {deal.name}
            </p>
          </div>

          {memo.sections.map((section, i) => (
            <section key={section.id} className="mb-9 last:mb-0">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="tabular text-foreground/40 font-serif text-[12px]">
                  §{(i + 1).toString().padStart(2, "0")}
                </span>
                <h2 className={cn("flex-1 font-serif text-[24px] leading-tight tracking-tight")}>
                  {section.title}
                </h2>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase",
                    section.reviewed
                      ? "border-sev-low/25 bg-sev-low/10 text-sev-low"
                      : "border-state-pending/25 bg-state-pending/10 text-state-pending",
                  )}
                >
                  {section.reviewed ? "Reviewed" : "Pending"}
                </span>
              </div>
              <MemoBody body={section.body} />
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function MemoBody({ body }: { body: string }) {
  const tokens = body.split(/(\[c\d+\]|\[rf\d+\])/g);
  return (
    <div className="text-foreground/85 font-serif text-[16px] leading-[1.65] whitespace-pre-line">
      {tokens.map((t, i) => {
        const cMatch = t.match(/^\[(c\d+)\]$/);
        if (cMatch) return <CitationLink key={i} id={cMatch[1]} />;
        const rfMatch = t.match(/^\[(rf\d+)\]$/);
        if (rfMatch) {
          const ref = RF_REFS[rfMatch[1]];
          return <CitationLink key={i} id={ref?.citation ?? "c1"} label={rfMatch[1]} />;
        }
        return <span key={i}>{t}</span>;
      })}
    </div>
  );
}
