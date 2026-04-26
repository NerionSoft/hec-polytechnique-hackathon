import { cn } from "@/src/presentation/lib/cn";
import { leadSources } from "@/src/lib/mock/leads";

export default function SourcesSettingsPage() {
  return (
    <section className="border-foreground/[0.08] bg-surface/60 rounded-[18px] border p-5">
      <h2 className="text-[15px] font-medium">Sources & scrapers</h2>
      <p className="text-foreground/55 mt-0.5 text-[12px]">
        Configure the data feeds powering the lead intelligence pool.
      </p>
      <ul className="divide-foreground/[0.06] mt-4 flex flex-col divide-y">
        {leadSources.map((s) => (
          <li key={s.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <div className="flex-1">
              <p className="text-[13px] font-medium">{s.name}</p>
              <p className="text-foreground/55 text-[11.5px] capitalize">{s.type}</p>
            </div>
            <p className="tabular text-foreground/55 text-[11.5px]">+{s.newToday} today</p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                s.active
                  ? "border-sev-low/25 bg-sev-low/10 text-sev-low border"
                  : "border-foreground/15 bg-foreground/[0.04] text-foreground/55 border",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  s.active ? "bg-sev-low" : "bg-foreground/30",
                )}
              />
              {s.active ? "Active" : "Inactive"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
