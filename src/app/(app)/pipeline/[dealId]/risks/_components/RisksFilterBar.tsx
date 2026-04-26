"use client";

import { useMemo, useState } from "react";
import { cn } from "@/src/presentation/lib/cn";
import type { RedFlag, RedFlagCategory, ReviewStatus } from "@/src/lib/mock/red-flags";
import { RedFlagCard } from "./RedFlagCard";

const CATEGORIES: { id: "all" | RedFlagCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "financial", label: "Financial" },
  { id: "legal", label: "Legal" },
  { id: "commercial", label: "Commercial" },
  { id: "operational", label: "Operational" },
  { id: "esg", label: "ESG" },
];

const STATUSES: { id: "all" | ReviewStatus; label: string }[] = [
  { id: "all", label: "All status" },
  { id: "pending_review", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "dismissed", label: "Dismissed" },
];

export function RisksFilterBar({ flags }: { flags: RedFlag[] }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]["id"]>("all");

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: flags.length };
    for (const c of CATEGORIES) {
      if (c.id === "all") continue;
      out[c.id] = flags.filter((f) => f.category === c.id).length;
    }
    return out;
  }, [flags]);

  const filtered = flags.filter((f) => {
    if (category !== "all" && f.category !== category) return false;
    if (status !== "all" && f.status !== status) return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => severityWeight(b.severity) - severityWeight(a.severity),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-8">
        {CATEGORIES.map((c) => {
          const active = c.id === category;
          const count = counts[c.id] ?? 0;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5",
                "border text-[12px] transition-colors",
                active
                  ? "border-foreground/20 bg-foreground/10 text-foreground"
                  : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/65 hover:text-foreground/85",
              )}
            >
              {c.label}
              <span
                className={cn(
                  "tabular text-[10.5px]",
                  active ? "text-foreground/55" : "text-foreground/35",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
        <span className="mx-2 hidden h-5 w-px bg-foreground/[0.08] sm:block" />
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as (typeof STATUSES)[number]["id"])
          }
          className={cn(
            "rounded-full border border-foreground/[0.08] bg-foreground/[0.02]",
            "px-3 py-1.5 text-[12px] text-foreground/75 outline-none",
            "appearance-none [background-image:none]",
            "hover:bg-foreground/[0.05]",
          )}
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id} className="bg-surface text-foreground">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 px-8 py-6">
        {sorted.length === 0 ? (
          <div
            className={cn(
              "rounded-[18px] border border-dashed border-foreground/[0.10]",
              "bg-foreground/[0.02] px-8 py-16 text-center",
            )}
          >
            <p className="font-serif text-[18px]">No red flags match these filters</p>
            <p className="mt-1 text-[12.5px] text-foreground/55">
              Try widening the category or status selection.
            </p>
          </div>
        ) : (
          sorted.map((flag) => <RedFlagCard key={flag.id} flag={flag} />)
        )}
      </div>
    </>
  );
}

function severityWeight(s: "low" | "medium" | "high" | "critical") {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s];
}
