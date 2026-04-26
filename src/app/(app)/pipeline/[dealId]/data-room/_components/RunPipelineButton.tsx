"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

interface Props {
  dealId: string;
  /** Total documents in the data room. Phase 0 of the pipeline ingests +
   *  indexes them itself, so we only gate on "no documents at all". */
  totalCount: number;
  /** Already-indexed documents — informational only, used in the tooltip. */
  indexedCount: number;
}

/**
 * Triggers the multi-agent DD pipeline by POSTing to /api/deals/:id/run.
 * Shows a runId once accepted; the analyst can then watch progress on
 * the audit page (which reads `dd_audit_event`) or the Inngest dev UI.
 */
export function RunPipelineButton({ dealId, indexedCount, totalCount }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabled = busy || pending || totalCount === 0;

  async function trigger() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/run`, { method: "POST" });
      const ct = res.headers.get("content-type") ?? "";
      const body: unknown = ct.includes("application/json")
        ? await res.json().catch(() => ({}))
        : { message: await res.text().catch(() => "") };
      if (!res.ok) {
        const b = body as { message?: string; error?: string };
        setError(
          `Pipeline trigger failed (${res.status}): ${b.message ?? b.error ?? res.statusText}`,
        );
        return;
      }
      const json = body as { runId: string };
      setRunId(json.runId);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const hint =
    totalCount === 0
      ? "Upload documents first."
      : indexedCount === totalCount
        ? `Run the 12-agent pipeline on ${totalCount} document${totalCount > 1 ? "s" : ""}.`
        : `Run the 12-agent pipeline on ${totalCount} document${totalCount > 1 ? "s" : ""} (Phase 0 will extract any not-yet-indexed file).`;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={trigger}
        disabled={disabled}
        title={hint}
        className={cn(
          "bg-foreground inline-flex items-center gap-1.5 rounded-full px-4 py-1.5",
          "text-background text-[12px] font-medium hover:opacity-90",
          "disabled:opacity-40",
        )}
      >
        {busy ? (
          <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />
        ) : (
          <Sparkles strokeWidth={1.6} className="size-3.5" />
        )}
        Run analysis
      </button>
      {runId && !error && (
        <p className="border-state-ai/30 bg-state-ai/10 text-state-ai rounded-[10px] border px-3 py-2 text-[11.5px]">
          Pipeline queued · run <span className="tabular">{runId.slice(0, 8)}</span>. Track progress
          in the audit tab.
        </p>
      )}
      {error && (
        <p className="border-warm/30 bg-warm/10 text-warm rounded-[10px] border px-3 py-2 text-[11.5px]">
          {error}
        </p>
      )}
    </div>
  );
}
