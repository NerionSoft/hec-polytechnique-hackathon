import { Bot, Download } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { audit } from "@/src/lib/mock/audit";
import { team } from "@/src/lib/mock/fund";
import { getDeal } from "@/src/lib/mock/deals";

export default function AuditSettingsPage() {
  const sorted = [...audit].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <section className="border-foreground/[0.08] bg-surface/60 rounded-[18px] border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-medium">Audit log</h2>
          <p className="text-foreground/55 mt-0.5 text-[12px]">
            {sorted.length} entries · all AI inferences and human overrides logged for compliance.
          </p>
        </div>
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
      </div>

      <ul className="divide-foreground/[0.06] flex flex-col divide-y">
        {sorted.map((entry) => {
          const member = entry.actor !== "ai" ? team.find((t) => t.id === entry.actor) : null;
          const deal = entry.dealId ? getDeal(entry.dealId) : null;
          return (
            <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0">
              {entry.actor === "ai" ? (
                <span className="border-state-ai/25 bg-state-ai/10 text-state-ai flex size-7 shrink-0 items-center justify-center rounded-full border">
                  <Bot strokeWidth={1.8} className="size-3.5" />
                </span>
              ) : member ? (
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-medium text-white"
                  style={{ background: `hsl(${member.avatarHue} 60% 35%)` }}
                >
                  {member.initials}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-foreground/85 text-[12.5px]">
                  <span className="text-foreground font-medium">
                    {entry.actor === "ai" ? "AI agent" : member?.name}
                  </span>{" "}
                  <span className="text-foreground/55">{entry.action}</span>{" "}
                  <span>{entry.target}</span>
                </p>
                <p className="text-foreground/45 mt-0.5 text-[11px]">
                  {deal && `${deal.name} · `}
                  {new Date(entry.timestamp).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
