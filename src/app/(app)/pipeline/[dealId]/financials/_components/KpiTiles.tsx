import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { Deal } from "@/src/lib/mock/deals";
import { CitationLink } from "../../_components/CitationLink";

export function KpiTiles({ deal }: { deal: Deal }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 sm:px-8 lg:grid-cols-4">
      <Tile
        label="Revenue FY24"
        value={`€${deal.revenue.toFixed(1)}M`}
        delta={`${signed(deal.growth)} YoY`}
        deltaTone="up"
        citation="c1"
      />
      <Tile
        label="EBITDA FY24"
        value={`€${deal.ebitda.toFixed(1)}M`}
        delta={`${(deal.ebitdaMargin * 100).toFixed(1)}% margin`}
        deltaTone="up"
        citation="c2"
      />
      <Tile
        label="Net debt"
        value={`€${(deal.netDebtEbitda * deal.ebitda).toFixed(1)}M`}
        delta={`${deal.netDebtEbitda.toFixed(1)}× EBITDA`}
        deltaTone={deal.netDebtEbitda > 3 ? "down" : "neutral"}
        citation="c4"
      />
      <Tile
        label="Growth"
        value={`${(deal.growth * 100).toFixed(1)}%`}
        delta="3-yr CAGR 27%"
        deltaTone="up"
        citation="c1"
      />
    </div>
  );
}

function Tile({
  label,
  value,
  delta,
  deltaTone = "neutral",
  citation,
}: {
  label: string;
  value: string;
  delta: string;
  deltaTone?: "up" | "down" | "neutral";
  citation?: string;
}) {
  const Arrow = deltaTone === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={cn("border-foreground/[0.08] bg-surface/60 rounded-[18px] border p-4")}>
      <div className="flex items-center justify-between">
        <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
        {citation && <CitationLink id={citation} />}
      </div>
      <p className="tabular mt-3 font-serif text-[28px] leading-none tracking-tight">{value}</p>
      <p
        className={cn(
          "tabular mt-2 inline-flex items-center gap-0.5 text-[11.5px]",
          deltaTone === "up" && "text-sev-low",
          deltaTone === "down" && "text-sev-high",
          deltaTone === "neutral" && "text-foreground/55",
        )}
      >
        {deltaTone !== "neutral" && <Arrow strokeWidth={1.6} className="size-3" />}
        {delta}
      </p>
    </div>
  );
}

function signed(v: number) {
  const s = `${(v * 100).toFixed(1)}%`;
  return v > 0 ? `+${s}` : s;
}
