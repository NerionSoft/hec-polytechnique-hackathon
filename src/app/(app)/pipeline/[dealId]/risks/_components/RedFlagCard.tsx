"use client";

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

export function RedFlagCard({ flag }: { flag: RedFlag }) {
  const doc = getDocument(flag.source.docId);
  const approver = flag.approvedBy
    ? team.find((t) => t.id === flag.approvedBy)
    : null;
  const open = useDrawerStore((s) => s.open);
  const citationId = RF_CITATION_MAP[flag.id] ?? "c1";

  return (
    <article
      id={flag.id}
      className={cn(
        "flex flex-col gap-4 rounded-[18px] border border-foreground/[0.08]",
        "bg-surface/60 p-5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={flag.severity} />
        <span
          className={cn(
            "rounded-full border border-foreground/[0.10] bg-foreground/[0.03] px-2 py-0.5",
            "text-[10.5px] font-medium uppercase tracking-[0.1em] text-foreground/65",
          )}
        >
          {flag.category}
        </span>
        <div className="ml-auto">
          <ReviewBadge status={flag.status} raisedBy={flag.raisedBy} />
        </div>
      </div>

      <div>
        <h3 className="font-serif text-[19px] tracking-tight text-foreground">
          {flag.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/75">
          {flag.summary}
        </p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/55">
          {flag.detail}
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 rounded-[12px] border border-foreground/[0.06]",
          "bg-foreground/[0.015] p-3",
        )}
      >
        <Row label="Source">
          <button
            type="button"
            onClick={() => open(citationId)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full",
              "bg-accent/10 px-2 py-0.5 text-[11.5px] font-medium text-accent",
              "transition-colors hover:bg-accent/20",
            )}
          >
            {doc?.name ?? flag.source.docId}
            {flag.source.sheet && ` · ${flag.source.sheet}`}
            {flag.source.line ? ` · ${flag.source.line}` : ` · p.${flag.source.page}`}
          </button>
        </Row>
        <Row label="Confidence">
          <span className="text-[12px] capitalize text-foreground/75">
            {flag.confidence}
          </span>
        </Row>
        <Row label="Suggested question">
          <span className="text-[12px] italic text-foreground/75">
            “{flag.suggestedQuestion}”
          </span>
        </Row>
        <Row label="Impact">
          <span className="text-[12px] text-foreground/75">{flag.impact}</span>
        </Row>
      </div>

      {flag.status === "approved" && approver && (
        <p className="text-[11.5px] text-foreground/45">
          Approved by {approver.name}
          {flag.approvedAt && ` · ${formatShort(flag.approvedAt)}`}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-foreground/[0.06] pt-4">
        {flag.status !== "approved" && (
          <ActionButton tone="primary">
            <Check strokeWidth={1.8} className="size-3.5" />
            Approve
          </ActionButton>
        )}
        <ActionButton>
          <Pencil strokeWidth={1.6} className="size-3.5" />
          Edit
        </ActionButton>
        <ActionButton>
          <X strokeWidth={1.8} className="size-3.5" />
          Dismiss
        </ActionButton>
        <span className="mx-1 hidden h-4 w-px bg-foreground/[0.08] sm:block" />
        <ActionButton>
          <Plus strokeWidth={1.8} className="size-3.5" />
          Add to memo
        </ActionButton>
        <ActionButton>
          <MessageSquarePlus strokeWidth={1.6} className="size-3.5" />
          Add to mgmt Q
        </ActionButton>
      </div>
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <span className="w-[110px] shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-foreground/45">
        {label}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function ActionButton({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-[12px] font-medium transition-colors",
        tone === "primary"
          ? "bg-foreground text-background hover:opacity-90"
          : "border border-foreground/[0.10] text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground",
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
