import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Check, ChevronLeft, FileText, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { getMeeting, type IcVote } from "@/src/lib/mock/ic";
import { getDeal } from "@/src/lib/mock/deals";
import { team } from "@/src/lib/mock/fund";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const meeting = getMeeting(meetingId);
  if (!meeting) notFound();
  const date = new Date(meeting.date);

  return (
    <div className="px-4 pb-12 sm:px-8">
      <div className="pt-6">
        <Link
          href="/ic"
          className={cn(
            "text-foreground/55 inline-flex items-center gap-1 text-[12px]",
            "hover:text-foreground transition-colors",
          )}
        >
          <ChevronLeft strokeWidth={1.6} className="size-3.5" />
          IC Calendar
        </Link>
      </div>

      <div className="mt-3 pb-6">
        <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
          IC #{meeting.number}
        </p>
        <h1 className="mt-1 flex items-center gap-2.5 font-serif text-[28px] tracking-tight">
          <Calendar strokeWidth={1.4} className="text-foreground/55 size-5" />
          {date.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </h1>
      </div>

      {meeting.minutes && (
        <div
          className={cn(
            "border-foreground/[0.08] bg-foreground/[0.02] mb-6 rounded-[16px] border p-4",
          )}
        >
          <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">Minutes</p>
          <p className="text-foreground/85 mt-2 font-serif text-[14px] leading-relaxed">
            {meeting.minutes}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {meeting.agenda.map((item) => {
          const deal = getDeal(item.dealId);
          if (!deal) return null;
          return (
            <article
              key={item.dealId}
              className="border-foreground/[0.08] bg-surface/60 rounded-[18px] border p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-serif text-[22px] tracking-tight">
                    {deal.flag} {deal.name}
                  </h2>
                  <p className="text-foreground/55 mt-0.5 text-[12.5px]">
                    {deal.sector} · €{deal.revenue.toFixed(1)}M revenue · ⏱{" "}
                    {deal.timeSavedDays.toFixed(1)} analyst-days saved
                  </p>
                </div>
                <Link
                  href={`/pipeline/${deal.id}/memo`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full",
                    "border-foreground/[0.10] border px-3 py-1.5",
                    "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground text-[12px]",
                  )}
                >
                  <FileText strokeWidth={1.6} className="size-3.5" />
                  Open memo
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_220px]">
                <Block label="Type" value={humanType(item.type)} />
                <Block
                  label="Memo status"
                  value={
                    item.memoStatus === "ready"
                      ? `Ready · all reviewed`
                      : `Draft · ${item.pendingReview} pending`
                  }
                  tone={item.memoStatus === "ready" ? "good" : "warm"}
                />
                <div>
                  <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
                    IC votes
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {item.votes.map((v) => {
                      const member = team.find((t) => t.id === v.memberId);
                      if (!member) return null;
                      return (
                        <li key={v.memberId} className="flex items-center gap-2 text-[12px]">
                          <span
                            className="flex size-5 shrink-0 items-center justify-center rounded-full text-[9.5px] font-medium text-white"
                            style={{
                              background: `hsl(${member.avatarHue} 60% 35%)`,
                            }}
                          >
                            {member.initials}
                          </span>
                          <span className="text-foreground/75 flex-1 truncate">{member.name}</span>
                          <VotePill vote={v.vote} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {meeting.status === "upcoming" && (
                <div className="border-foreground/[0.06] mt-5 flex items-center gap-2 border-t pt-4">
                  <button
                    type="button"
                    className={cn(
                      "bg-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
                      "text-background text-[12px] font-medium hover:opacity-90",
                    )}
                  >
                    <Check strokeWidth={1.8} className="size-3.5" />
                    Vote yes
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full",
                      "border-foreground/[0.10] border px-3.5 py-1.5",
                      "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground text-[12px]",
                    )}
                  >
                    <X strokeWidth={1.8} className="size-3.5" />
                    Vote no
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "text-foreground/55 ml-auto rounded-full px-3 py-1.5 text-[12px]",
                      "hover:text-foreground",
                    )}
                  >
                    Add comment
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Block({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warm";
}) {
  return (
    <div>
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[13.5px] font-medium",
          tone === "good" && "text-sev-low",
          tone === "warm" && "text-warm",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function VotePill({ vote }: { vote: IcVote }) {
  if (vote === "yes") {
    return (
      <span className="border-sev-low/25 bg-sev-low/10 text-sev-low inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium">
        <Check strokeWidth={2} className="size-2.5" />
        Yes
      </span>
    );
  }
  if (vote === "no") {
    return (
      <span className="border-sev-crit/25 bg-sev-crit/10 text-sev-crit inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium">
        <X strokeWidth={2} className="size-2.5" />
        No
      </span>
    );
  }
  if (vote === "abstain") {
    return (
      <span className="border-foreground/15 bg-foreground/[0.04] text-foreground/55 rounded-full border px-2 py-0.5 text-[10.5px]">
        Abstain
      </span>
    );
  }
  return (
    <span className="border-state-pending/25 bg-state-pending/10 text-state-pending rounded-full border px-2 py-0.5 text-[10.5px] font-medium">
      Pending
    </span>
  );
}

function humanType(t: "final_decision" | "indicative_offer" | "update") {
  return t === "final_decision"
    ? "Final go/no-go"
    : t === "indicative_offer"
      ? "Indicative offer"
      : "Update";
}
