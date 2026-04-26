import { cn } from "@/src/presentation/lib/cn";
import { leadSources } from "@/src/lib/mock/leads";

export default function SourcesSettingsPage() {
  return (
    <section className="rounded-[18px] border border-foreground/[0.08] bg-surface/60 p-5">
      <h2 className="text-[15px] font-medium">Sources & scrapers</h2>
      <p className="mt-0.5 text-[12px] text-foreground/55">
        Configure the data feeds powering the lead intelligence pool.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-foreground/[0.06]">
        {leadSources.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex-1">
              <p className="text-[13px] font-medium">{s.name}</p>
              <p className="text-[11.5px] text-foreground/55 capitalize">{s.type}</p>
            </div>
            <p className="text-[11.5px] tabular text-foreground/55">
              +{s.newToday} today
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                s.active
                  ? "border border-sev-low/25 bg-sev-low/10 text-sev-low"
                  : "border border-foreground/15 bg-foreground/[0.04] text-foreground/55",
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
