import { cn } from "@/src/presentation/lib/cn";

type Decision = "REJECT" | "WATCHLIST" | "OUTREACH";

const TONE: Record<Decision, string> = {
  OUTREACH: "bg-sev-low/15 text-sev-low",
  WATCHLIST: "bg-sev-med/15 text-sev-med",
  REJECT: "bg-sev-crit/15 text-sev-crit",
};

export function ScorePill({
  score,
  decision,
}: {
  score: number | null;
  decision: Decision | null;
}) {
  if (score == null) return <span className="text-foreground/30">—</span>;
  return (
    <span
      className={cn(
        "inline-block min-w-[44px] rounded-full px-2 py-0.5 text-center",
        "tabular text-[11.5px] font-medium",
        decision ? TONE[decision] : "bg-foreground/10 text-foreground/70",
      )}
    >
      {score}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "text-[10.5px] font-medium tracking-[0.10em] uppercase",
        TONE[decision],
      )}
    >
      {decision}
    </span>
  );
}
