import { notFound } from "next/navigation";
import { findPipelineDeal, findPipelineMemo } from "@/src/lib/data/pipeline";
import { team, fund } from "@/src/lib/mock/fund";
import { formatRelativeDate } from "@/src/lib/utils";
import { AutoPrint } from "./AutoPrint";
import "./print.css";

const RF_REFS: Record<string, string> = {
  rf1: "NordPlast change-of-control",
  rf2: "Customer concentration",
  rf3: "EBITDA add-backs",
  rf4: "Covenant headroom",
};

export const dynamic = "force-dynamic";

export default async function MemoPrintPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = await findPipelineDeal(dealId);
  if (!deal) notFound();
  const memo = await findPipelineMemo(dealId);
  if (!memo) notFound();

  const editor = team.find((t) => t.id === memo.lastEditedBy);
  const generatedAt = new Date();

  return (
    <div className="memo-print">
      <AutoPrint title={`IC Memo · ${deal.name}`} />

      <header className="memo-cover">
        <div className="memo-fund">
          <p className="memo-eyebrow">{fund.fund}</p>
          <p className="memo-fund-name">{fund.shortName}</p>
        </div>
        <h1 className="memo-title">Investment Committee Memorandum</h1>
        <p className="memo-deal">{deal.name}</p>
        <dl className="memo-meta">
          <div>
            <dt>Sector</dt>
            <dd>{deal.sector}</dd>
          </div>
          <div>
            <dt>Geography</dt>
            <dd>{deal.geo}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{memo.status}</dd>
          </div>
          <div>
            <dt>Last edit</dt>
            <dd>
              {editor?.name ?? "—"} · {formatRelativeDate(memo.lastEditedAt)}
            </dd>
          </div>
        </dl>
        <p className="memo-footer-note">
          Generated{" "}
          {generatedAt.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          ·{" "}
          {generatedAt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </header>

      <main className="memo-body">
        {memo.sections.map((section, i) => (
          <section key={section.id} className="memo-section">
            <div className="memo-section-head">
              <span className="memo-section-no">§{(i + 1).toString().padStart(2, "0")}</span>
              <h2>{section.title}</h2>
            </div>
            <MemoBody body={section.body} />
          </section>
        ))}
      </main>

      <footer className="memo-foot">
        <span>
          {fund.shortName} · IC Memo · {deal.name}
        </span>
        <span>Confidential</span>
      </footer>
    </div>
  );
}

function MemoBody({ body }: { body: string }) {
  const tokens = body.split(/(\[c\d+\]|\[rf\d+\])/g);
  return (
    <div className="memo-prose">
      {tokens.map((t, i) => {
        const c = t.match(/^\[(c\d+)\]$/);
        if (c)
          return (
            <sup key={i} className="memo-cite">
              {c[1]}
            </sup>
          );
        const rf = t.match(/^\[(rf\d+)\]$/);
        if (rf) {
          const label = RF_REFS[rf[1]] ?? rf[1];
          return (
            <span key={i} className="memo-rf">
              [{rf[1].toUpperCase()} · {label}]
            </span>
          );
        }
        return <span key={i}>{t}</span>;
      })}
    </div>
  );
}
