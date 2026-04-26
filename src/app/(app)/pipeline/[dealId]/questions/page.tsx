import { notFound } from "next/navigation";
import { cn } from "@/src/presentation/lib/cn";
import { findPipelineDeal, listPipelineQuestions } from "@/src/lib/data/pipeline";
import { PageHeader } from "../../../_components/PageHeader";
import { ReviewBadge } from "../_components/ReviewBadge";
import { formatRelativeDate } from "@/src/lib/utils";

export default async function QuestionsPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = await findPipelineDeal(dealId);
  if (!deal) notFound();
  const qs = await listPipelineQuestions(dealId);

  const grouped = qs.reduce<Record<string, typeof qs>>((acc, q) => {
    (acc[q.topic] ??= []).push(q);
    return acc;
  }, {});

  const aiCount = qs.filter((q) => q.raisedById === "ai").length;
  const sentCount = qs.filter((q) => q.status === "sent" || q.status === "answered").length;

  return (
    <>
      <PageHeader
        title="Management Questions"
        description={`${qs.length} questions · ${aiCount} from AI · ${qs.length - aiCount} manual · ${sentCount} sent`}
        action={
          <button
            type="button"
            className={cn(
              "bg-foreground text-background rounded-full px-4 py-2 text-[12px] font-medium",
              "hover:opacity-90",
            )}
          >
            Send to management
          </button>
        }
      />
      <div className="flex flex-col gap-6 px-4 pb-12 sm:px-8">
        {Object.entries(grouped).map(([topic, items]) => (
          <section key={topic}>
            <h2 className={cn("text-foreground/45 mb-3 text-[10.5px] tracking-[0.14em] uppercase")}>
              {topic} · {items.length}
            </h2>
            <ul className="flex flex-col gap-2">
              {items.map((q) => (
                <li
                  key={q.id}
                  className={cn(
                    "border-foreground/[0.08] flex flex-col gap-2 rounded-[14px] border",
                    "bg-surface/60 p-4",
                  )}
                >
                  <p className="text-foreground/85 text-[14px] leading-relaxed">{q.body}</p>
                  <div className="text-foreground/55 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <ReviewBadge
                      status={
                        q.status === "sent" || q.status === "answered" ? "approved" : q.status
                      }
                      raisedBy={q.raisedById === "ai" ? "ai" : "human"}
                    />
                    <span>raised by {q.raisedBy}</span>
                    <span>· {formatRelativeDate(q.createdAt)}</span>
                    {q.derivedFrom && (
                      <span className="bg-foreground/[0.05] text-foreground/65 rounded-full px-2 py-0.5 text-[10.5px]">
                        derived from {q.derivedFrom}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
