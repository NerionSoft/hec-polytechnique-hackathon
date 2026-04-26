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
    <section className="border-foreground/[0.08] bg-surface/60 rounded-[18px] border p-5">
      <h2 className="text-[15px] font-medium">Team & permissions</h2>
      <p className="text-foreground/55 mt-0.5 text-[12px]">
        Role-based access control. Use the role switcher in the topbar to preview each role.
      </p>
      <ul className="divide-foreground/[0.06] mt-4 flex flex-col divide-y">
        {team.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[11.5px] font-medium text-white"
              style={{ background: `hsl(${m.avatarHue} 60% 35%)` }}
            >
              {m.initials}
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-medium">{m.name}</p>
              <p className="text-foreground/55 text-[11.5px]">{m.role}</p>
            </div>
            <ul className={cn("hidden max-w-[60%] flex-wrap items-center gap-1.5 sm:flex")}>
              {PERMS[m.role]?.map((p) => (
                <li
                  key={p}
                  className={cn(
                    "border-foreground/[0.08] bg-foreground/[0.02] rounded-full border",
                    "text-foreground/65 px-2 py-0.5 text-[10.5px]",
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
