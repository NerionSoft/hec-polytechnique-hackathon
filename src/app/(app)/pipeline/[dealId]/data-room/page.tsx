import { notFound } from "next/navigation";
import { FolderLock } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { documentsForDeal } from "@/src/lib/mock/documents";
import { getDeal } from "@/src/lib/mock/deals";
import { PageHeader } from "../../../_components/PageHeader";
import { formatRelativeDate } from "@/src/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  commercial: "Commercial",
  financial: "Financial",
  legal: "Legal",
  hr: "HR",
  tax: "Tax",
};

export default async function DataRoomPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = getDeal(dealId);
  if (!deal) notFound();
  const docs = documentsForDeal(dealId);
  const totalCitations = docs.reduce((s, d) => s + d.citations, 0);

  const grouped = docs.reduce<Record<string, typeof docs>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Data Room"
        description={`${docs.length} documents · ${totalCitations} citations indexed · last activity ${formatRelativeDate(docs[0].updatedAt)}`}
      />
      <div className="grid grid-cols-1 gap-4 px-8 py-6 lg:grid-cols-[240px_1fr]">
        <aside
          className={cn(
            "rounded-[16px] border border-foreground/[0.08] bg-surface/40 p-3",
            "h-max",
          )}
        >
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-3 last:mb-0">
              <p className="px-2 pb-1 text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
                {CATEGORY_LABEL[cat] ?? cat} · {items.length}
              </p>
              <ul className="flex flex-col">
                {items.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className={cn(
                        "block w-full truncate rounded-[8px] px-2 py-1.5 text-left",
                        "text-[12px] text-foreground/65",
                        "hover:bg-foreground/[0.04] hover:text-foreground",
                      )}
                    >
                      {doc.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <div className={cn("rounded-[16px] border border-foreground/[0.08] bg-surface/40")}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-foreground/[0.08] text-left text-[10.5px] uppercase tracking-[0.14em] text-foreground/45">
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
                  className="border-b border-foreground/[0.04] last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-2.5 text-foreground/85">{doc.name}</td>
                  <td className="px-4 py-2.5 text-foreground/55 capitalize">
                    {CATEGORY_LABEL[doc.category]?.toLowerCase() ?? doc.category}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full",
                        "border border-sev-low/25 bg-sev-low/10 px-2 py-0.5",
                        "text-[10.5px] font-medium text-sev-low",
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-sev-low" />
                      indexed
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular text-foreground/75">
                    {doc.citations}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular text-foreground/45">
                    {formatRelativeDate(doc.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-foreground/[0.08] px-4 py-3">
            <p className="text-[11.5px] text-foreground/55">
              <FolderLock strokeWidth={1.6} className="mr-1 inline size-3" />
              All documents encrypted at rest · access logged
            </p>
            <button
              type="button"
              className={cn(
                "rounded-full bg-foreground px-3.5 py-1.5",
                "text-[12px] font-medium text-background hover:opacity-90",
              )}
            >
              + Upload
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
