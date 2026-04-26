"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Check, FolderOpen, Gavel, Loader2, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { Stage } from "@/src/lib/mock/deals";
import type { PipelineEntityKind } from "@/src/lib/data/pipeline";

interface Props {
  entityKind: PipelineEntityKind;
  sourceId: string;
  stage: Stage;
  decision?: "passed" | "rejected";
}

export function WorkspaceActions({ entityKind, sourceId, stage, decision }: Props) {
  if (entityKind === "lead") {
    return <LeadAdvance leadId={sourceId} />;
  }
  if (entityKind === "deal") {
    return <DealAdvance dealId={sourceId} stage={stage} decision={decision} />;
  }
  return null;
}

function LeadAdvance({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function promote() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/open-data-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        setError(json.message ?? `HTTP ${res.status}`);
        return;
      }
      const { dealId } = (await res.json()) as { dealId: string };
      router.push(`/pipeline/${dealId}/data-room`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <PrimaryButton onClick={promote} busy={busy} icon={FolderOpen}>
        Promote to deal
      </PrimaryButton>
      {error && <ErrorPill>{error}</ErrorPill>}
    </div>
  );
}

function DealAdvance({
  dealId,
  stage,
  decision,
}: {
  dealId: string;
  stage: Stage;
  decision?: "passed" | "rejected";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"ic_ready" | "approve" | "pass" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function advance(
    to: "IC_READY" | "DECIDED",
    label: typeof busy,
    decision?: "PASSED" | "REJECTED",
  ) {
    setBusy(label);
    setError(null);
    try {
      const body = to === "DECIDED" ? JSON.stringify({ to, decision }) : JSON.stringify({ to });
      const res = await fetch(`/api/deals/${dealId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        setError(json.message ?? `HTTP ${res.status}`);
        return;
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (stage === "in_dd") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <PrimaryButton
          onClick={() => advance("IC_READY", "ic_ready")}
          busy={busy === "ic_ready" || pending}
          icon={Gavel}
        >
          Mark IC ready
        </PrimaryButton>
        {error && <ErrorPill>{error}</ErrorPill>}
      </div>
    );
  }

  if (stage === "ic_ready") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <SecondaryButton
            onClick={() => advance("DECIDED", "pass", "REJECTED")}
            busy={busy === "pass" || pending}
            icon={X}
            tone="warm"
          >
            Pass
          </SecondaryButton>
          <PrimaryButton
            onClick={() => advance("DECIDED", "approve", "PASSED")}
            busy={busy === "approve" || pending}
            icon={Check}
          >
            Approve deal
          </PrimaryButton>
        </div>
        {error && <ErrorPill>{error}</ErrorPill>}
      </div>
    );
  }

  if (stage === "decided") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium",
          decision === "passed"
            ? "border-sev-low/30 bg-sev-low/10 text-sev-low"
            : "border-foreground/15 bg-foreground/[0.04] text-foreground/55",
        )}
      >
        {decision === "passed" ? (
          <>
            <Check strokeWidth={1.8} className="size-3.5" />
            Approved
          </>
        ) : (
          <>
            <X strokeWidth={1.8} className="size-3.5" />
            Passed
          </>
        )}
      </span>
    );
  }

  return null;
}

function PrimaryButton({
  onClick,
  busy,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  icon: typeof ArrowRight;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "bg-foreground text-background inline-flex items-center gap-1.5 rounded-full",
        "px-4 py-1.5 text-[12px] font-medium hover:opacity-90 disabled:opacity-50",
      )}
    >
      {busy ? (
        <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />
      ) : (
        <Icon strokeWidth={1.6} className="size-3.5" />
      )}
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  busy,
  icon: Icon,
  tone = "default",
  children,
}: {
  onClick: () => void;
  busy: boolean;
  icon: typeof ArrowRight;
  tone?: "default" | "warm";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5",
        "text-[12px] font-medium disabled:opacity-50",
        tone === "warm"
          ? "border-warm/30 bg-warm/5 text-warm hover:bg-warm/10"
          : "border-foreground/[0.10] text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground",
      )}
    >
      {busy ? (
        <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />
      ) : (
        <Icon strokeWidth={1.6} className="size-3.5" />
      )}
      {children}
    </button>
  );
}

function ErrorPill({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-warm/30 bg-warm/10 text-warm rounded-[8px] border px-2 py-1 text-[10.5px]">
      {children}
    </p>
  );
}
