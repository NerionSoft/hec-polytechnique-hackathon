"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquarePlus, Pencil, Plus, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { RedFlag } from "@/src/lib/mock/red-flags";
import { getDocument } from "@/src/lib/mock/documents";
import { team } from "@/src/lib/mock/fund";
import { useDrawerStore } from "@/src/lib/stores/drawer-store";
import { SeverityBadge } from "../../_components/SeverityBadge";
import { ReviewBadge } from "../../_components/ReviewBadge";

const RF_CITATION_MAP: Record<string, string> = {
  rf1: "c5",
  rf2: "c3",
  rf3: "c2",
  rf4: "c4",
  rf5: "c5",
  rf6: "c1",
  rf7: "c1",
};

type Toast = { kind: "ok" | "err"; msg: string } | null;

export function RedFlagCard({ flag }: { flag: RedFlag }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const doc = getDocument(flag.source.docId);
  const approver = flag.approvedBy ? team.find((t) => t.id === flag.approvedBy) : null;
  const open = useDrawerStore((s) => s.open);
  const citationId = RF_CITATION_MAP[flag.id] ?? "c1";

  const canMutate = Boolean(flag.findingId);

  function flash(t: NonNullable<Toast>) {
    setToast(t);
    window.setTimeout(() => setToast(null), 3000);
  }

  function call(path: string, init?: RequestInit, okMsg?: string) {
    startTransition(async () => {
      if (!flag.findingId) {
        flash({ kind: "err", msg: "Demo flag — actions disabled" });
        return;
      }
      try {
        const res = await fetch(`/api/findings/${flag.findingId}${path}`, {
          method: init?.method ?? "POST",
          headers: { "Content-Type": "application/json" },
          ...init,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { message?: string } | null;
          flash({ kind: "err", msg: j?.message ?? `HTTP ${res.status}` });
          return;
        }
        if (okMsg) flash({ kind: "ok", msg: okMsg });
        router.refresh();
      } catch (err) {
        flash({ kind: "err", msg: err instanceof Error ? err.message : "Network error" });
      }
    });
  }

  return (
    <article
      id={flag.id}
      className={cn(
        "border-foreground/[0.08] flex flex-col gap-4 rounded-[18px] border",
        "bg-surface/60 p-5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={flag.severity} />
        <span
          className={cn(
            "border-foreground/[0.10] bg-foreground/[0.03] rounded-full border px-2 py-0.5",
            "text-foreground/65 text-[10.5px] font-medium tracking-[0.1em] uppercase",
          )}
        >
          {flag.category}
        </span>
        <div className="ml-auto">
          <ReviewBadge status={flag.status} raisedBy={flag.raisedBy} />
        </div>
      </div>

      <div>
        <h3 className="text-foreground font-serif text-[19px] tracking-tight">{flag.title}</h3>
        <p className="text-foreground/75 mt-1 text-[13px] leading-relaxed">{flag.summary}</p>
        <p className="text-foreground/55 mt-2 text-[12.5px] leading-relaxed">{flag.detail}</p>
      </div>

      <div
        className={cn(
          "border-foreground/[0.06] flex flex-col gap-2 rounded-[12px] border",
          "bg-foreground/[0.015] p-3",
        )}
      >
        <Row label="Source">
          <button
            type="button"
            onClick={() => open(citationId)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full",
              "bg-accent/10 text-accent px-2 py-0.5 text-[11.5px] font-medium",
              "hover:bg-accent/20 transition-colors",
            )}
          >
            {doc?.name ?? flag.source.docId}
            {flag.source.sheet && ` · ${flag.source.sheet}`}
            {flag.source.line ? ` · ${flag.source.line}` : ` · p.${flag.source.page}`}
          </button>
        </Row>
        <Row label="Confidence">
          <span className="text-foreground/75 text-[12px] capitalize">{flag.confidence}</span>
        </Row>
        <Row label="Suggested question">
          <span className="text-foreground/75 text-[12px] italic">“{flag.suggestedQuestion}”</span>
        </Row>
        <Row label="Impact">
          <span className="text-foreground/75 text-[12px]">{flag.impact}</span>
        </Row>
      </div>

      {flag.status === "approved" && approver && (
        <p className="text-foreground/45 text-[11.5px]">
          Approved by {approver.name}
          {flag.approvedAt && ` · ${formatShort(flag.approvedAt)}`}
        </p>
      )}

      {editing && (
        <EditForm
          flag={flag}
          pending={pending}
          onCancel={() => setEditing(false)}
          onSave={(patch) => {
            call("", { method: "PATCH", body: JSON.stringify(patch) }, "Saved");
            setEditing(false);
          }}
        />
      )}

      <div className="border-foreground/[0.06] flex flex-wrap items-center gap-2 border-t pt-4">
        {flag.status !== "approved" && (
          <ActionButton
            tone="primary"
            disabled={pending || !canMutate}
            onClick={() => call("/approve", undefined, "Approved")}
            title={canMutate ? undefined : "Demo flag — actions disabled"}
          >
            <Check strokeWidth={1.8} className="size-3.5" />
            Approve
          </ActionButton>
        )}
        <ActionButton
          disabled={pending || !canMutate}
          onClick={() => setEditing((v) => !v)}
          title={canMutate ? undefined : "Demo flag — actions disabled"}
        >
          <Pencil strokeWidth={1.6} className="size-3.5" />
          {editing ? "Close" : "Edit"}
        </ActionButton>
        {flag.status !== "dismissed" && (
          <ActionButton
            disabled={pending || !canMutate}
            onClick={() => call("/dismiss", undefined, "Dismissed")}
            title={canMutate ? undefined : "Demo flag — actions disabled"}
          >
            <X strokeWidth={1.8} className="size-3.5" />
            Dismiss
          </ActionButton>
        )}
        <span className="bg-foreground/[0.08] mx-1 hidden h-4 w-px sm:block" />
        <ActionButton
          disabled={pending || !canMutate}
          onClick={() => call("/add-to-memo", undefined, "Added to memo")}
          title={canMutate ? undefined : "Demo flag — actions disabled"}
        >
          <Plus strokeWidth={1.8} className="size-3.5" />
          Add to memo
        </ActionButton>
        <ActionButton
          disabled={pending || !canMutate}
          onClick={() => call("/add-to-question", undefined, "Added to mgmt Q")}
          title={canMutate ? undefined : "Demo flag — actions disabled"}
        >
          <MessageSquarePlus strokeWidth={1.6} className="size-3.5" />
          Add to mgmt Q
        </ActionButton>
        {toast && (
          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium",
              toast.kind === "ok" ? "bg-sev-low/15 text-sev-low" : "bg-warm/15 text-warm",
            )}
          >
            {toast.msg}
          </span>
        )}
      </div>
    </article>
  );
}

function EditForm({
  flag,
  pending,
  onCancel,
  onSave,
}: {
  flag: RedFlag;
  pending: boolean;
  onCancel: () => void;
  onSave: (patch: EditPatch) => void;
}) {
  const [title, setTitle] = useState(flag.title);
  const [summary, setSummary] = useState(flag.summary);
  const [detail, setDetail] = useState(flag.detail);
  const [suggestedQuestion, setSuggestedQuestion] = useState(flag.suggestedQuestion);
  const [impact, setImpact] = useState(flag.impact);

  const dirty =
    title !== flag.title ||
    summary !== flag.summary ||
    detail !== flag.detail ||
    suggestedQuestion !== flag.suggestedQuestion ||
    impact !== flag.impact;

  return (
    <div
      className={cn(
        "border-foreground/[0.10] flex flex-col gap-3 rounded-[12px] border border-dashed",
        "bg-foreground/[0.02] p-3",
      )}
    >
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          maxLength={200}
        />
      </Field>
      <Field label="Summary">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className={inputCls}
          maxLength={2000}
        />
      </Field>
      <Field label="Detail">
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          className={inputCls}
          maxLength={8000}
        />
      </Field>
      <Field label="Suggested question">
        <textarea
          value={suggestedQuestion}
          onChange={(e) => setSuggestedQuestion(e.target.value)}
          rows={2}
          className={inputCls}
          maxLength={2000}
        />
      </Field>
      <Field label="Impact">
        <textarea
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          rows={2}
          className={inputCls}
          maxLength={2000}
        />
      </Field>
      <div className="flex items-center justify-end gap-2">
        <ActionButton onClick={onCancel} disabled={pending}>
          Cancel
        </ActionButton>
        <ActionButton
          tone="primary"
          disabled={pending || !dirty || title.trim().length === 0}
          onClick={() =>
            onSave({
              title: title.trim(),
              summary: summary.trim(),
              detail: detail.trim(),
              suggestedQuestion: suggestedQuestion.trim(),
              impact: impact.trim(),
            })
          }
        >
          Save
        </ActionButton>
      </div>
    </div>
  );
}

type EditPatch = {
  title: string;
  summary: string;
  detail: string;
  suggestedQuestion: string;
  impact: string;
};

const inputCls = cn(
  "w-full rounded-[10px] border border-foreground/[0.10] bg-background/60",
  "px-2.5 py-1.5 text-[12.5px] text-foreground placeholder:text-foreground/40",
  "outline-none focus:border-foreground/30",
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-foreground/45 text-[10.5px] tracking-[0.12em] uppercase">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <span className="text-foreground/45 w-[110px] shrink-0 text-[10.5px] tracking-[0.12em] uppercase">
        {label}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function ActionButton({
  children,
  tone = "default",
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  tone?: "default" | "primary";
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-[12px] font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary"
          ? "bg-foreground text-background hover:opacity-90"
          : "border-foreground/[0.10] text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground border",
      )}
    >
      {children}
    </button>
  );
}

function formatShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
