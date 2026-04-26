import { cn } from "@/src/presentation/lib/cn";
import type { Severity } from "@/src/lib/mock/red-flags";

const STYLES: Record<Severity, { dot: string; pill: string; label: string }> = {
  low: {
    dot: "bg-sev-low",
    pill: "border-sev-low/25 bg-sev-low/10 text-sev-low",
    label: "Low",
  },
  medium: {
    dot: "bg-sev-med",
    pill: "border-sev-med/25 bg-sev-med/10 text-sev-med",
    label: "Medium",
  },
  high: {
    dot: "bg-sev-high",
    pill: "border-sev-high/25 bg-sev-high/10 text-sev-high",
    label: "High",
  },
  critical: {
    dot: "bg-sev-crit",
    pill: "border-sev-crit/30 bg-sev-crit/10 text-sev-crit",
    label: "Critical",
  },
};

export function SeverityBadge({
  severity,
  size = "md",
}: {
  severity: Severity;
  size?: "sm" | "md";
}) {
  const s = STYLES[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[10.5px]",
        "font-medium tracking-[0.1em] uppercase",
        s.pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: Severity }) {
  return <span className={cn("inline-block size-2 rounded-full", STYLES[severity].dot)} />;
}
