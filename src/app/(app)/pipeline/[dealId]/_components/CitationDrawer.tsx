"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { useDrawerStore } from "@/src/lib/stores/drawer-store";
import { getCitation } from "@/src/lib/mock/citations";
import { getDocument } from "@/src/lib/mock/documents";

export function CitationDrawer() {
  const { citationId, close } = useDrawerStore();
  const citation = citationId ? getCitation(citationId) : null;
  const doc = citation ? getDocument(citation.docId) : null;

  useEffect(() => {
    if (!citationId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [citationId, close]);

  return (
    <>
      <div
        aria-hidden={!citationId}
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          citationId ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col",
          "border-foreground/[0.10] bg-surface border-l",
          "shadow-[0_50px_120px_-30px_rgba(0,0,0,0.8)]",
          "transition-transform duration-300 ease-out",
          citationId ? "translate-x-0" : "translate-x-full",
        )}
      >
        {citation && doc ? (
          <DrawerContent citation={citation} doc={doc} />
        ) : (
          <div className="text-foreground/40 p-6">No citation selected</div>
        )}

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className={cn(
            "absolute top-4 right-4 flex size-8 items-center justify-center",
            "border-foreground/[0.10] bg-foreground/[0.04] rounded-full border",
            "text-foreground/55 transition-colors",
            "hover:bg-foreground/[0.08] hover:text-foreground",
          )}
        >
          <X strokeWidth={1.6} className="size-4" />
        </button>
      </aside>
    </>
  );
}

function DrawerContent({
  citation,
  doc,
}: {
  citation: ReturnType<typeof getCitation>;
  doc: ReturnType<typeof getDocument>;
}) {
  if (!citation || !doc) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-foreground/[0.08] flex items-start gap-3 border-b px-6 pt-6 pr-14 pb-5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            "border-foreground/[0.10] bg-foreground/[0.04] text-foreground/65 border",
          )}
        >
          <FileText strokeWidth={1.6} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[16px] tracking-tight">{doc.name}</p>
          <p className="text-foreground/55 mt-0.5 text-[11.5px]">
            Page {citation.page} · {doc.pages > 0 ? `${doc.pages} pages total` : "spreadsheet"}
          </p>
        </div>
      </div>

      <div className="border-foreground/[0.08] flex items-center justify-between border-b px-6 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            className={cn(
              "flex size-7 items-center justify-center rounded-full",
              "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground",
            )}
          >
            <ChevronLeft strokeWidth={1.6} className="size-4" />
          </button>
          <span className="tabular text-foreground/55 text-[11.5px]">
            {citation.page} / {doc.pages || 1}
          </span>
          <button
            type="button"
            aria-label="Next page"
            className={cn(
              "flex size-7 items-center justify-center rounded-full",
              "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground",
            )}
          >
            <ChevronRight strokeWidth={1.6} className="size-4" />
          </button>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
            "tracking-[0.12em]",
            citation.confidence === "high"
              ? "border-sev-low/25 bg-sev-low/10 text-sev-low"
              : citation.confidence === "medium"
                ? "border-sev-med/25 bg-sev-med/10 text-sev-med"
                : "border-foreground/15 bg-foreground/[0.04] text-foreground/60",
          )}
        >
          {citation.confidence} confidence
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div
          className={cn("border-foreground/[0.08] bg-foreground/[0.02] rounded-[18px] border p-5")}
        >
          <PdfMockPage docName={doc.name} excerpt={citation.excerpt} />
        </div>

        <div className="mt-5">
          <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
            Highlighted excerpt
          </p>
          <p className="text-foreground/85 mt-2 text-[13px] leading-relaxed">{citation.excerpt}</p>
        </div>

        <div className="mt-5">
          <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">Used in</p>
          <ul className="mt-2 flex flex-col gap-1">
            {citation.usedIn.map((u) => (
              <li
                key={u}
                className={cn("text-foreground/75 flex items-center gap-2 text-[12.5px]")}
              >
                <ExternalLink strokeWidth={1.6} className="text-foreground/35 size-3" />
                {u}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cn("border-foreground/[0.08] flex items-center gap-2 border-t px-6 py-3")}>
        <button
          type="button"
          className={cn(
            "border-foreground/[0.10] rounded-full border px-3 py-1.5",
            "text-foreground/70 text-[12px] transition-colors",
            "hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          Re-extract
        </button>
        <button
          type="button"
          className={cn(
            "border-foreground/[0.10] rounded-full border px-3 py-1.5",
            "text-foreground/70 text-[12px] transition-colors",
            "hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          Mark inaccurate
        </button>
      </div>
    </div>
  );
}

function PdfMockPage({ docName, excerpt }: { docName: string; excerpt: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-[12px]",
        "border-foreground/[0.08] border bg-[#f4f0e8] text-[#2a2622]",
      )}
    >
      <div className="absolute inset-x-5 top-5 border-b border-[#2a2622]/20 pb-2">
        <p className="font-serif text-[10px] tracking-[0.18em] text-[#2a2622]/55 uppercase">
          {docName}
        </p>
      </div>
      <div className="absolute inset-x-5 top-12 space-y-1.5">
        {[
          "1.1 Overview",
          "The Company has demonstrated consistent",
          "growth across all reporting periods, with",
          "increasing diversification of customer base",
          "and ongoing expansion into adjacent markets.",
        ].map((line, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-sm bg-[#2a2622]/20",
              i === 0 ? "w-1/3" : i === 4 ? "w-2/3" : "w-full",
            )}
          />
        ))}
      </div>
      <div className="absolute inset-x-5 top-32 space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-1.5 w-full rounded-sm bg-[#2a2622]/15" />
        ))}
      </div>
      <div
        className={cn(
          "border-warm absolute inset-x-5 top-44 rounded-[6px] border-l-2",
          "bg-warm/20 p-3 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)]",
        )}
      >
        <p className="font-serif text-[10px] leading-snug text-[#2a2622]">{excerpt}</p>
      </div>
      <div className="absolute inset-x-5 bottom-5 space-y-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1.5 rounded-sm bg-[#2a2622]/15", i === 5 ? "w-1/2" : "w-full")}
          />
        ))}
      </div>
    </div>
  );
}
