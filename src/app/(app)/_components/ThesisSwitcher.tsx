"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Briefcase, Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

export interface ThesisSummary {
  id: string;
  name: string;
}

export function ThesisSwitcher({
  theses,
  selectedThesisId,
}: {
  theses: ThesisSummary[];
  selectedThesisId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const selected = theses.find((t) => t.id === selectedThesisId) ?? theses[0] ?? null;

  async function select(thesisId: string) {
    setOpen(false);
    if (thesisId === selectedThesisId) return;
    const res = await fetch("/api/theses/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thesisId }),
    });
    if (!res.ok) return;
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5",
          "border-foreground/[0.08] bg-foreground/[0.03] border",
          "hover:bg-foreground/[0.06] transition-colors disabled:opacity-50",
        )}
      >
        <Briefcase strokeWidth={1.6} className="text-foreground/65 size-3.5" />
        <span className="max-w-[180px] truncate text-[12.5px] font-medium">
          {selected ? selected.name : "No thesis"}
        </span>
        <ChevronDown strokeWidth={1.6} className="text-foreground/55 size-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className={cn(
              "absolute top-[calc(100%+6px)] right-0 z-50 w-[280px]",
              "border-foreground/10 bg-surface rounded-[14px] border",
              "p-1.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]",
            )}
          >
            <p
              className={cn(
                "px-2.5 pt-2 pb-1.5 text-[10.5px] uppercase",
                "text-foreground/40 tracking-[0.14em]",
              )}
            >
              Active thesis
            </p>
            {theses.length === 0 && (
              <p className="text-foreground/55 px-2.5 py-2 text-[12.5px]">No theses yet.</p>
            )}
            {theses.map((t) => {
              const active = t.id === selectedThesisId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => select(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2",
                    "text-left transition-colors",
                    active ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]",
                  )}
                >
                  <span className="flex-1 truncate text-[12.5px] font-medium">{t.name}</span>
                  {active && <Check strokeWidth={2} className="text-foreground/70 size-3.5" />}
                </button>
              );
            })}
            <div className="border-foreground/[0.06] mt-1 border-t pt-1">
              <Link
                href="/settings/thesis"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-[10px] px-2.5 py-2",
                  "text-foreground/65 text-[12.5px] transition-colors",
                  "hover:bg-foreground/[0.04] hover:text-foreground",
                )}
              >
                <Plus strokeWidth={1.6} className="size-3.5" />
                Manage theses
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
