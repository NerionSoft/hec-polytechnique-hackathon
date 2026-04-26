"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinancialsHelios } from "@/src/lib/mock/financials";

export function TrendChart({ data }: { data: FinancialsHelios["trend"] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: "hsl(var(--muted))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `€${v}M`}
            width={42}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border-strong))", strokeWidth: 1 }}
            contentStyle={{
              background: "hsl(var(--surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{ color: "hsl(var(--muted))", marginBottom: 4 }}
            formatter={(v, name) => [
              `€${Number(v).toFixed(1)}M`,
              name === "revenue" ? "Revenue" : "EBITDA",
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--accent))"
            fill="url(#rev-gradient)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="ebitda"
            stroke="hsl(var(--warm))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--warm))", r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="text-foreground/60 mt-2 flex items-center justify-end gap-4 px-2 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-accent h-0.5 w-3 rounded" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-warm h-0.5 w-3 rounded" /> EBITDA
        </span>
      </div>
    </div>
  );
}
