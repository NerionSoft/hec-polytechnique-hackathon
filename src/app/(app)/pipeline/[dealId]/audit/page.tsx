import { notFound } from "next/navigation";
import { Bot, Download } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { auditForDeal } from "@/src/lib/mock/audit";
import { getDeal } from "@/src/lib/mock/deals";
import { team } from "@/src/lib/mock/fund";
import { PageHeader } from "../../../_components/PageHeader";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = getDeal(dealId);
  if (!deal) notFound();
  const entries = auditForDeal(dealId);

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
              "border border-foreground/[0.10] px-3 py-1.5",
              "text-[12px] text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground",
            )}
          >
            <Download strokeWidth={1.6} className="size-3.5" />
            Export CSV
          </button>
        }
      />

      <div className="px-8 pb-12">
        <ol
          className={cn(
            "relative flex flex-col gap-4 rounded-[18px] border border-foreground/[0.08]",
            "bg-surface/60 p-6",
          )}
        >
          <span className="absolute left-[34px] top-6 bottom-6 w-px bg-foreground/[0.08]" />
          {entries.map((entry) => {
            const member = entry.actor !== "ai" ? team.find((t) => t.id === entry.actor) : null;
            return (
              <li key={entry.id} className="relative flex items-start gap-4">
                {entry.actor === "ai" ? (
                  <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-state-ai/25 bg-state-ai/10 text-state-ai">
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
                  <p className="text-[13px] text-foreground/85">
                    <span className="font-medium text-foreground">
                      {entry.actor === "ai" ? "AI agent" : member?.name}
                    </span>{" "}
                    <span className="text-foreground/55">{entry.action}</span>{" "}
                    <span>{entry.target}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-foreground/45">
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
