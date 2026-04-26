import { cn } from "@/src/presentation/lib/cn";
import { team } from "@/src/lib/mock/fund";

const PERMS: Record<string, string[]> = {
  Partner: ["All deals · all tabs", "Approve red flags", "Schedule IC", "Promote leads"],
  VP: ["All deals · all tabs", "Approve red flags", "Send mgmt Q"],
  Associate: ["Assigned deals", "Edit memo", "Propose flags"],
  Analyst: ["Assigned deals", "Upload docs", "Draft questions"],
  "IC Member": ["Pipeline view", "Memos shared with IC", "Vote IC"],
};

export default function TeamSettingsPage() {
  return (
    <section className="rounded-[18px] border border-foreground/[0.08] bg-surface/60 p-5">
      <h2 className="text-[15px] font-medium">Team & permissions</h2>
      <p className="mt-0.5 text-[12px] text-foreground/55">
        Role-based access control. Use the role switcher in the topbar to preview
        each role.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-foreground/[0.06]">
        {team.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[11.5px] font-medium text-white"
              style={{ background: `hsl(${m.avatarHue} 60% 35%)` }}
            >
              {m.initials}
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-medium">{m.name}</p>
              <p className="text-[11.5px] text-foreground/55">{m.role}</p>
            </div>
            <ul
              className={cn(
                "hidden flex-wrap items-center gap-1.5 sm:flex max-w-[60%]",
              )}
            >
              {PERMS[m.role]?.map((p) => (
                <li
                  key={p}
                  className={cn(
                    "rounded-full border border-foreground/[0.08] bg-foreground/[0.02]",
                    "px-2 py-0.5 text-[10.5px] text-foreground/65",
                  )}
                >
                  {p}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
