"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Sparkles, Target } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

interface Props {
  leadId: string;
  thesisId: string | null;
  hasEnrichment: boolean;
  hasScore: boolean;
}

export function LeadActions({ leadId, thesisId, hasEnrichment, hasScore }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"enrich" | "score" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enrich() {
    setBusy("enrich");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Enrich failed: ${text || res.statusText}`);
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function score() {
    if (!thesisId) {
      setError("Pick an active thesis first.");
      return;
    }
    setBusy("score");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thesisId }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Score failed: ${text || res.statusText}`);
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={enrich}
          disabled={busy !== null || pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full",
            "border-foreground/[0.10] bg-foreground/[0.04] border px-3 py-1.5",
            "text-foreground/85 hover:bg-foreground/[0.08] text-[12px]",
            "disabled:opacity-50",
          )}
        >
          {busy === "enrich" ? (
            <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />
          ) : (
            <Sparkles strokeWidth={1.6} className="size-3.5" />
          )}
          {hasEnrichment ? "Re-enrich" : "Enrich"}
        </button>
        <button
          type="button"
          onClick={score}
          disabled={busy !== null || pending || !thesisId || !hasEnrichment}
          className={cn(
            "bg-foreground inline-flex items-center gap-1.5 rounded-full px-4 py-1.5",
            "text-background text-[12px] font-medium hover:opacity-90",
            "disabled:opacity-40",
          )}
          title={!hasEnrichment ? "Enrich first" : undefined}
        >
          {busy === "score" ? (
            <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />
          ) : (
            <Target strokeWidth={1.6} className="size-3.5" />
          )}
          {hasScore ? "Re-score" : "Score against thesis"}
        </button>
      </div>
      {error && (
        <p className="border-warm/30 bg-warm/10 text-warm rounded-[10px] border px-3 py-2 text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}
