import { notFound } from "next/navigation";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { memoHelios } from "@/src/lib/mock/memo";
import { getDeal } from "@/src/lib/mock/deals";
import { team } from "@/src/lib/mock/fund";
import { PageHeader } from "../../../_components/PageHeader";
import { CitationLink } from "../_components/CitationLink";
import { formatRelativeDate } from "@/src/lib/utils";

const RF_REFS: Record<string, { citation: string; title: string }> = {
  rf1: { citation: "c5", title: "NordPlast change-of-control" },
  rf2: { citation: "c3", title: "Customer concentration" },
  rf3: { citation: "c2", title: "EBITDA add-backs" },
  rf4: { citation: "c4", title: "Covenant headroom" },
};

export default async function MemoPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = getDeal(dealId);
  if (!deal) notFound();
  const memo = memoHelios;
  const editor = team.find((t) => t.id === memo.lastEditedBy);

  return (
    <>
      <PageHeader
        title="IC Memo"
        description={`Status: ${memo.status} · ${Math.round(memo.reviewProgress * 100)}% reviewed · ${memo.pendingItems} items pending · last edit by ${editor?.name} ${formatRelativeDate(memo.lastEditedAt)}`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full",
                "border border-foreground/[0.10] px-3 py-1.5",
                "text-[12px] text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <RefreshCw strokeWidth={1.6} className="size-3.5" />
              Regenerate
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5",
                "text-[12px] font-medium text-background hover:opacity-90",
              )}
            >
              <Download strokeWidth={1.6} className="size-3.5" />
              Export
            </button>
          </div>
        }
      />

      <div className="px-8 pb-12">
        <div
          className={cn(
            "mx-auto max-w-[760px] rounded-[24px] border border-foreground/[0.08]",
            "bg-surface/50 p-10",
          )}
        >
          <div className="mb-8 flex items-center gap-2 border-b border-foreground/[0.08] pb-4">
            <Sparkles strokeWidth={1.6} className="size-4 text-warm" />
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
              Investment Committee Memo · {deal.name}
            </p>
          </div>

          {memo.sections.map((section, i) => (
            <section key={section.id} className="mb-9 last:mb-0">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-serif text-[12px] tabular text-foreground/40">
                  §{(i + 1).toString().padStart(2, "0")}
                </span>
                <h2
                  className={cn(
                    "flex-1 font-serif text-[24px] leading-tight tracking-tight",
                  )}
                >
                  {section.title}
                </h2>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
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

        <p
          className={cn(
            "mx-auto mt-6 max-w-[760px] text-center text-[11px] text-foreground/45",
          )}
        >
          Export blocked until all sections are human-reviewed.
        </p>
      </div>
    </>
  );
}

function MemoBody({ body }: { body: string }) {
  const tokens = body.split(/(\[c\d+\]|\[rf\d+\])/g);
  return (
    <div className="font-serif text-[16px] leading-[1.65] text-foreground/85 whitespace-pre-line">
      {tokens.map((t, i) => {
        const cMatch = t.match(/^\[(c\d+)\]$/);
        if (cMatch) return <CitationLink key={i} id={cMatch[1]} />;
        const rfMatch = t.match(/^\[(rf\d+)\]$/);
        if (rfMatch) {
          const ref = RF_REFS[rfMatch[1]];
          return (
            <CitationLink
              key={i}
              id={ref?.citation ?? "c1"}
              label={rfMatch[1]}
            />
          );
        }
        return <span key={i}>{t}</span>;
      })}
    </div>
  );
}
