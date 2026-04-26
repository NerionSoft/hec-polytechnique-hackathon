import { Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { fund } from "@/src/lib/mock/fund";

const ALL_SECTORS = [
  "B2B SaaS",
  "Industrial Tech",
  "Healthtech",
  "Fintech",
  "Agritech",
  "Cleantech",
  "Cybersecurity",
  "Consumer · D2C",
  "Vertical SaaS",
  "Logistics",
  "MarTech",
];

const ALL_GEOS = [
  "FR",
  "DE",
  "BNL",
  "Nordics",
  "Iberia",
  "UK",
  "DACH",
  "CEE",
  "Italy",
  "Switzerland",
];

export default function ThesisSettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Sectors"
        description="Targets must match at least one of these sectors. Drives the sector fit axis (max 25 pts)."
      >
        <div className="flex flex-wrap gap-2">
          {ALL_SECTORS.map((s) => {
            const active = fund.thesis.sectors.includes(s);
            return (
              <span
                key={s}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  active
                    ? "border-foreground/20 bg-foreground/10 text-foreground"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/55 hover:text-foreground/85",
                )}
              >
                {s}
              </span>
            );
          })}
        </div>
      </Section>

      <Section
        title="Geography"
        description="Core markets weighted full points; adjacent markets weighted 70%."
      >
        <div className="flex flex-wrap gap-2">
          {ALL_GEOS.map((g) => {
            const active = fund.thesis.geo.includes(g);
            return (
              <span
                key={g}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  active
                    ? "border-foreground/20 bg-foreground/10 text-foreground"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/55 hover:text-foreground/85",
                )}
              >
                {g}
              </span>
            );
          })}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Section title="Revenue range" compact>
          <div className="flex items-center gap-3">
            <Field label="Min" value={`€${fund.thesis.revenueRange.min}M`} />
            <span className="text-foreground/35">—</span>
            <Field label="Max" value={`€${fund.thesis.revenueRange.max}M`} />
          </div>
        </Section>
        <Section title="EBITDA margin floor" compact>
          <Field label="Min margin" value={`${(fund.thesis.ebitdaMargin.min * 100).toFixed(0)}%`} />
        </Section>
        <Section title="Growth floor" compact>
          <Field label="Min YoY growth" value={`${(fund.thesis.growth.min * 100).toFixed(0)}%`} />
        </Section>
        <Section title="Multiple cap" compact>
          <Field label="Max multiple" value={`${fund.thesis.multipleCap}×`} />
        </Section>
      </div>

      <div
        className={cn(
          "border-foreground/[0.10] flex items-start gap-3 rounded-[16px] border",
          "bg-foreground/[0.02] p-4",
        )}
      >
        <span className="bg-warm/15 text-warm flex size-8 shrink-0 items-center justify-center rounded-full">
          <Sparkles strokeWidth={1.6} className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-medium">Live preview</p>
          <p className="text-foreground/65 mt-1 text-[12.5px]">
            With this thesis, <span className="text-foreground font-medium">DataRoom GmbH</span>{" "}
            would score <span className="tabular text-foreground">91 / 100</span>, and{" "}
            <span className="text-foreground font-medium">PetitLux Cosmetics</span> would score{" "}
            <span className="tabular text-foreground">58 / 100</span>.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "bg-foreground shrink-0 rounded-full px-3.5 py-1.5",
            "text-background text-[12px] font-medium hover:opacity-90",
          )}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  compact = false,
  children,
}: {
  title: string;
  description?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border-foreground/[0.08] flex flex-col gap-3 rounded-[18px] border",
        "bg-surface/60 p-5",
        compact && "gap-2",
      )}
    >
      <div>
        <h2 className="text-[15px] font-medium">{title}</h2>
        {description && <p className="text-foreground/55 mt-0.5 text-[12px]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={cn(
        "border-foreground/[0.08] flex flex-1 flex-col gap-0.5 rounded-[10px] border",
        "bg-foreground/[0.02] px-3 py-2",
      )}
    >
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
      <p className="tabular text-[15px] font-medium">{value}</p>
    </div>
  );
}
