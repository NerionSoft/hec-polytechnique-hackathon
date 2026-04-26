import { notFound } from "next/navigation";
import { FolderLock } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { documentsForDeal as mockDocs } from "@/src/lib/mock/documents";
import { getDeal as getMockDeal } from "@/src/lib/mock/deals";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";
import { PageHeader } from "../../../_components/PageHeader";
import { formatRelativeDate } from "@/src/lib/utils";
import { UploadDropzone } from "./_components/UploadDropzone";
import { RunPipelineButton } from "./_components/RunPipelineButton";

const CATEGORY_LABEL: Record<string, string> = {
  COMMERCIAL: "Commercial",
  FINANCIAL: "Financial",
  LEGAL: "Legal",
  HR: "HR",
  TAX: "Tax",
  commercial: "Commercial",
  financial: "Financial",
  legal: "Legal",
  hr: "HR",
  tax: "Tax",
};

const STATUS_PILL: Record<string, string> = {
  UPLOADED: "border-state-pending/25 bg-state-pending/10 text-state-pending",
  EXTRACTING: "border-state-ai/25 bg-state-ai/10 text-state-ai",
  INDEXED: "border-sev-low/25 bg-sev-low/10 text-sev-low",
  FAILED: "border-sev-crit/25 bg-sev-crit/10 text-sev-crit",
  indexed: "border-sev-low/25 bg-sev-low/10 text-sev-low",
};

const STATUS_DOT: Record<string, string> = {
  UPLOADED: "bg-state-pending",
  EXTRACTING: "bg-state-ai",
  INDEXED: "bg-sev-low",
  FAILED: "bg-sev-crit",
  indexed: "bg-sev-low",
};

const STATUS_LABEL: Record<string, string> = {
  UPLOADED: "uploaded",
  EXTRACTING: "extracting",
  INDEXED: "indexed",
  FAILED: "failed",
  indexed: "indexed",
};

type ViewDoc = {
  id: string;
  name: string;
  category: string | null;
  status: string;
  pages: number | null;
  citations: number | null;
  updatedAt: string;
};

export default async function DataRoomPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;

  const realDeal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });

  let docs: ViewDoc[];
  let isReal: boolean;
  let mockDealName: string | undefined;

  if (realDeal) {
    isReal = true;
    docs = realDeal.documents.map((d) => ({
      id: d.id,
      name: d.filename,
      category: d.category,
      status: d.status,
      pages: d.pageCount,
      citations: null,
      updatedAt: d.updatedAt.toISOString(),
    }));
  } else {
    const mockDeal = getMockDeal(dealId);
    if (!mockDeal) notFound();
    isReal = false;
    mockDealName = mockDeal.name;
    docs = mockDocs(dealId).map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category.toUpperCase(),
      status: d.status,
      pages: d.pages,
      citations: d.citations,
      updatedAt: d.updatedAt,
    }));
  }

  const totalCitations = docs.reduce((s, d) => s + (d.citations ?? 0), 0);
  const lastActivity = docs[0]?.updatedAt;

  const grouped = docs.reduce<Record<string, ViewDoc[]>>((acc, d) => {
    const key = d.category ?? "UNCATEGORIZED";
    (acc[key] ??= []).push(d);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Data Room"
        description={
          docs.length === 0
            ? "No documents yet. Drop a folder below to ingest the data room."
            : `${docs.length} document${docs.length > 1 ? "s" : ""}${
                totalCitations > 0 ? ` · ${totalCitations} citations indexed` : ""
              }${lastActivity ? ` · last activity ${formatRelativeDate(lastActivity)}` : ""}`
        }
      />

      {!isReal && (
        <div
          className={cn(
            "mx-8 mb-4 flex items-start gap-3 rounded-[14px]",
            "border-state-pending/25 bg-state-pending/5 border p-3",
          )}
        >
          <FolderLock strokeWidth={1.6} className="text-state-pending mt-0.5 size-4" />
          <div className="text-state-pending text-[12px]">
            <p className="font-medium">Demo data shown for {mockDealName}</p>
            <p className="text-state-pending/85 mt-0.5">
              This deal lives in mock data only. To upload real files, open a deal created from a
              qualified lead — the dropzone is wired to Vercel Blob and Neon Postgres.
            </p>
          </div>
        </div>
      )}

      {isReal && (
        <div className="flex flex-col gap-3 px-8">
          <UploadDropzone dealId={dealId} />
          <div className="flex justify-end">
            <RunPipelineButton
              dealId={dealId}
              indexedCount={docs.filter((d) => d.status === "INDEXED").length}
              totalCount={docs.length}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 px-8 py-6 lg:grid-cols-[240px_1fr]">
        <aside
          className={cn("border-foreground/[0.08] bg-surface/40 h-max rounded-[16px] border p-3")}
        >
          {Object.keys(grouped).length === 0 ? (
            <p className="text-foreground/45 px-2 py-3 text-[11.5px]">
              Categories will appear here as documents are ingested.
            </p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="mb-3 last:mb-0">
                <p className="text-foreground/45 px-2 pb-1 text-[10.5px] tracking-[0.14em] uppercase">
                  {CATEGORY_LABEL[cat] ?? cat} · {items.length}
                </p>
                <ul className="flex flex-col">
                  {items.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        className={cn(
                          "block w-full truncate rounded-[8px] px-2 py-1.5 text-left",
                          "text-foreground/65 text-[12px]",
                          "hover:bg-foreground/[0.04] hover:text-foreground",
                        )}
                      >
                        {doc.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </aside>

        <div className={cn("border-foreground/[0.08] bg-surface/40 rounded-[16px] border")}>
          {docs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-foreground/65 font-serif text-[18px]">No documents indexed yet</p>
              <p className="text-foreground/45 mt-1 text-[12px]">
                Upload a folder above. Files are auto-categorized by folder name.
              </p>
            </div>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-foreground/[0.08] text-foreground/45 border-b text-left text-[10.5px] tracking-[0.14em] uppercase">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Citations</th>
                  <th className="px-4 py-2.5 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-foreground/[0.04] hover:bg-foreground/[0.02] border-b last:border-0"
                  >
                    <td className="text-foreground/85 px-4 py-2.5">{doc.name}</td>
                    <td className="text-foreground/55 px-4 py-2.5 capitalize">
                      {doc.category
                        ? (CATEGORY_LABEL[doc.category] ?? doc.category).toLowerCase()
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={doc.status} />
                    </td>
                    <td className="tabular text-foreground/75 px-4 py-2.5 text-right">
                      {doc.citations ?? "—"}
                    </td>
                    <td className="tabular text-foreground/45 px-4 py-2.5 text-right">
                      {formatRelativeDate(doc.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="border-foreground/[0.08] flex items-center justify-between border-t px-4 py-3">
            <p className="text-foreground/55 text-[11.5px]">
              <FolderLock strokeWidth={1.6} className="mr-1 inline size-3" />
              All documents stored on Vercel Blob · access logged
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const pill = STATUS_PILL[status] ?? STATUS_PILL.UPLOADED;
  const dot = STATUS_DOT[status] ?? STATUS_DOT.UPLOADED;
  const label = STATUS_LABEL[status] ?? status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-[10.5px] font-medium",
        pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
