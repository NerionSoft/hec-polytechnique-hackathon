"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Copy, Loader2, Mail, Send, Sparkles } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

export interface OutreachDraftDto {
  id: string;
  leadId: string;
  thesisId: string | null;
  recipient: string | null;
  subject: string;
  body: string;
  status: "DRAFT" | "APPROVED" | "SENT";
  model: string;
  promptHash: string;
  generatedAt: string;
  approvedAt: string | null;
  sentAt: string | null;
  updatedAt: string;
}

interface Props {
  leadId: string;
  thesisId: string | null;
  hasEnrichment: boolean;
  initialDrafts: OutreachDraftDto[];
}

export function OutreachPanel({ leadId, thesisId, hasEnrichment, initialDrafts }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<OutreachDraftDto[]>(initialDrafts);
  const [activeId, setActiveId] = useState<string | null>(initialDrafts[0]?.id ?? null);
  const [busy, setBusy] = useState<"generate" | "save" | "approve" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const active = drafts.find((d) => d.id === activeId) ?? null;

  function startEdit(d: OutreachDraftDto) {
    setActiveId(d.id);
    setEditing({ subject: d.subject, body: d.body });
    setError(null);
  }

  async function generate() {
    if (!thesisId) {
      setError("Pick an active thesis first.");
      return;
    }
    setBusy("generate");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thesisId }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Generate failed: ${text || res.statusText}`);
        return;
      }
      const data = (await res.json()) as { draft: OutreachDraftDto };
      setDrafts((prev) => [data.draft, ...prev]);
      setActiveId(data.draft.id);
      setEditing({ subject: data.draft.subject, body: data.draft.body });
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!active || !editing) return;
    setBusy("save");
    setError(null);
    try {
      const res = await fetch(`/api/outreach/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editing.subject, body: editing.body }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Save failed: ${text || res.statusText}`);
        return;
      }
      const data = (await res.json()) as { draft: OutreachDraftDto };
      setDrafts((prev) => prev.map((d) => (d.id === data.draft.id ? data.draft : d)));
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!active) return;
    setBusy("approve");
    try {
      const res = await fetch(`/api/outreach/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Approve failed: ${text || res.statusText}`);
        return;
      }
      const data = (await res.json()) as { draft: OutreachDraftDto };
      setDrafts((prev) => prev.map((d) => (d.id === data.draft.id ? data.draft : d)));
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function markSent() {
    if (!active) return;
    if (!confirm("Mark this draft as SENT? No email will be sent — this is an audit stamp."))
      return;
    setBusy("send");
    try {
      const res = await fetch(`/api/outreach/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markSent" }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Mark sent failed: ${text || res.statusText}`);
        return;
      }
      const data = (await res.json()) as { draft: OutreachDraftDto };
      setDrafts((prev) => prev.map((d) => (d.id === data.draft.id ? data.draft : d)));
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function copyToClipboard() {
    if (!active) return;
    const text = `Subject: ${active.subject}\n\n${active.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }

  function mailtoHref(d: OutreachDraftDto): string {
    const params = new URLSearchParams();
    params.set("subject", d.subject);
    params.set("body", d.body);
    const recipient = d.recipient ?? "";
    return `mailto:${recipient}?${params.toString()}`;
  }

  return (
    <section className="border-foreground/[0.08] bg-surface/60 rounded-[20px] border p-6">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
            Outreach drafts
          </p>
          <h2 className="text-[15px] font-medium">
            {drafts.length} draft{drafts.length === 1 ? "" : "s"}
          </h2>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={busy !== null || pending || !thesisId || !hasEnrichment}
          className={cn(
            "bg-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
            "text-background text-[12px] font-medium hover:opacity-90 disabled:opacity-40",
          )}
          title={!hasEnrichment ? "Enrich the lead first" : undefined}
        >
          {busy === "generate" ? (
            <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />
          ) : (
            <Sparkles strokeWidth={1.6} className="size-3.5" />
          )}
          Generate draft
        </button>
      </header>

      {error && (
        <p className="border-warm/30 bg-warm/10 text-warm mb-3 rounded-[10px] border px-3 py-2 text-[12px]">
          {error}
        </p>
      )}

      {drafts.length === 0 && (
        <p className="text-foreground/55 text-[12.5px]">
          {hasEnrichment
            ? "No drafts yet. Generate one — the LLM uses the enrichment summary, rationale, and active thesis."
            : "Run “Enrich” first; the outreach drafter relies on the enrichment narrative."}
        </p>
      )}

      {drafts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr]">
          <aside className="flex flex-col gap-1.5">
            {drafts.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => startEdit(d)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-[10px] border px-2.5 py-2 text-left",
                  "transition-colors",
                  d.id === activeId
                    ? "border-foreground/20 bg-foreground/[0.05]"
                    : "border-foreground/[0.06] bg-foreground/[0.02] hover:bg-foreground/[0.04]",
                )}
              >
                <StatusPill status={d.status} />
                <span className="text-foreground mt-1 truncate text-[11.5px] font-medium">
                  {d.subject}
                </span>
                <span className="text-foreground/45 text-[10px]">
                  {new Date(d.generatedAt).toLocaleString()}
                </span>
              </button>
            ))}
          </aside>

          {active && editing && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <StatusPill status={active.status} />
                <span className="text-foreground/45 text-[10.5px]">
                  {active.model} · prompt {active.promptHash.slice(0, 12)}…
                </span>
              </div>

              <input
                type="text"
                value={editing.subject}
                onChange={(e) => setEditing((p) => p && { ...p, subject: e.target.value })}
                disabled={active.status === "SENT"}
                className={cn(
                  "border-foreground/[0.08] rounded-[10px] border bg-transparent px-3 py-2",
                  "text-foreground focus:border-foreground/30 text-[14px] font-medium focus:outline-none",
                  "disabled:opacity-60",
                )}
              />
              <textarea
                value={editing.body}
                onChange={(e) => setEditing((p) => p && { ...p, body: e.target.value })}
                rows={12}
                disabled={active.status === "SENT"}
                className={cn(
                  "border-foreground/[0.08] rounded-[10px] border bg-transparent px-3 py-2",
                  "text-foreground/85 text-[12.5px] leading-relaxed",
                  "focus:border-foreground/30 focus:outline-none disabled:opacity-60",
                )}
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={
                    busy !== null ||
                    pending ||
                    active.status === "SENT" ||
                    (editing.subject === active.subject && editing.body === active.body)
                  }
                  className={cn(
                    "border-foreground/[0.10] bg-foreground/[0.04] rounded-full border px-3 py-1.5",
                    "text-foreground/85 hover:bg-foreground/[0.08] text-[12px] disabled:opacity-50",
                  )}
                >
                  {busy === "save" ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={approve}
                  disabled={busy !== null || active.status !== "DRAFT"}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5",
                    "border-foreground/[0.10] bg-foreground/[0.04] border text-[12px]",
                    "text-foreground/85 hover:bg-foreground/[0.08] disabled:opacity-50",
                  )}
                >
                  <Check strokeWidth={1.6} className="size-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5",
                    "border-foreground/[0.10] bg-foreground/[0.04] border text-[12px]",
                    "text-foreground/85 hover:bg-foreground/[0.08]",
                  )}
                >
                  <Copy strokeWidth={1.6} className="size-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <a
                  href={mailtoHref(active)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5",
                    "border-foreground/[0.10] bg-foreground/[0.04] border text-[12px]",
                    "text-foreground/85 hover:bg-foreground/[0.08]",
                  )}
                >
                  <Mail strokeWidth={1.6} className="size-3.5" />
                  Open in mail client
                </a>
                <button
                  type="button"
                  onClick={markSent}
                  disabled={busy !== null || active.status === "SENT"}
                  className={cn(
                    "bg-foreground ml-auto inline-flex items-center gap-1 rounded-full px-4 py-1.5",
                    "text-background text-[12px] font-medium hover:opacity-90 disabled:opacity-40",
                  )}
                >
                  <Send strokeWidth={1.6} className="size-3.5" />
                  Mark as sent
                </button>
              </div>

              <p className="text-foreground/45 text-[10.5px]">
                No SMTP integration. “Mark as sent” only stamps an audit timestamp and moves the
                lead to CONTACTED status.
                {active.sentAt && ` Marked sent ${new Date(active.sentAt).toLocaleString()}.`}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: "DRAFT" | "APPROVED" | "SENT" }) {
  const tone =
    status === "SENT"
      ? "bg-sev-low/15 text-sev-low"
      : status === "APPROVED"
        ? "bg-sev-med/15 text-sev-med"
        : "bg-foreground/[0.08] text-foreground/65";
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5",
        "text-[10.5px] font-medium tracking-[0.10em] uppercase",
        tone,
      )}
    >
      {status}
    </span>
  );
}
