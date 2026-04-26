import Link from "next/link";
import { ArrowRight, Calendar, Check, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { icMeetings } from "@/src/lib/mock/ic";
import { getDeal } from "@/src/lib/mock/deals";
import { PageHeader } from "../_components/PageHeader";

export default function IcPage() {
  const upcoming = icMeetings.filter((m) => m.status === "upcoming");
  const past = icMeetings.filter((m) => m.status === "past");

  return (
    <>
      <PageHeader
        title="Investment Committee"
        description={`${upcoming.length} upcoming meetings · ${past.length} held this quarter`}
      />

      <div className="px-8 pb-12">
        <SectionTitle>Upcoming</SectionTitle>
        <div className="flex flex-col gap-3">
          {upcoming.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>

        <SectionTitle className="mt-10">Past</SectionTitle>
        <div className="flex flex-col gap-3">
          {past.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      </div>
    </>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn("text-foreground/45 mb-3 text-[10.5px] tracking-[0.14em] uppercase", className)}
    >
      {children}
    </h2>
  );
}

function MeetingCard({ meeting }: { meeting: (typeof icMeetings)[number] }) {
  const date = new Date(meeting.date);
  return (
    <Link
      href={`/ic/${meeting.id}`}
      className={cn(
        "border-foreground/[0.08] bg-surface/60 flex flex-col gap-4 rounded-[18px] border p-5",
        "hover:border-foreground/15 hover:bg-surface transition-colors",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2.5">
            <Calendar strokeWidth={1.6} className="text-foreground/55 size-4" />
            <p className="font-serif text-[19px] tracking-tight">
              {date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <span className="text-foreground/55 text-[12.5px]">
              · {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="text-foreground/45 mt-1 text-[11.5px] tracking-[0.14em] uppercase">
            IC #{meeting.number} · {meeting.agenda.length} item
            {meeting.agenda.length > 1 ? "s" : ""}
          </p>
        </div>
        <ArrowRight strokeWidth={1.6} className="text-foreground/45 size-4" />
      </div>

      <ul className="border-foreground/[0.06] flex flex-col gap-2.5 border-t pt-4">
        {meeting.agenda.map((item) => {
          const deal = getDeal(item.dealId);
          if (!deal) return null;
          const yes = item.votes.filter((v) => v.vote === "yes").length;
          const no = item.votes.filter((v) => v.vote === "no").length;
          const decided = item.votes.every((v) => v.vote !== "pending");
          return (
            <li
              key={item.dealId}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px]"
            >
              <span className="text-foreground font-medium">
                {deal.flag} {deal.name}
              </span>
              <span className="text-foreground/55">— {humanType(item.type)}</span>
              {item.memoStatus === "ready" ? (
                <span className="border-sev-low/25 bg-sev-low/10 text-sev-low rounded-full border px-2 py-0.5 text-[10.5px] font-medium">
                  memo ready
                </span>
              ) : (
                <span className="border-state-pending/25 bg-state-pending/10 text-state-pending rounded-full border px-2 py-0.5 text-[10.5px] font-medium">
                  memo draft
                </span>
              )}
              {item.pendingReview > 0 && (
                <span className="text-warm text-[11px]">{item.pendingReview} pending review</span>
              )}
              {decided && meeting.status === "past" && (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                    "text-[10.5px] font-medium",
                    yes > no
                      ? "border-sev-low/25 bg-sev-low/10 text-sev-low border"
                      : "border-foreground/15 bg-foreground/[0.04] text-foreground/55 border",
                  )}
                >
                  {yes > no ? (
                    <Check strokeWidth={2} className="size-2.5" />
                  ) : (
                    <X strokeWidth={2} className="size-2.5" />
                  )}
                  {yes > no ? "Approved" : "Passed"} ({yes}-{no})
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Link>
  );
}

function humanType(t: "final_decision" | "indicative_offer" | "update") {
  return t === "final_decision"
    ? "Final go/no-go"
    : t === "indicative_offer"
      ? "Indicative offer"
      : "Update";
}
