import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    if (Math.abs(value) >= 1) return `€${value.toFixed(1)}M`;
    return `€${(value * 1000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 1,
  }).format(value * 1_000_000);
}

export function formatPercent(value: number, opts?: { signed?: boolean }) {
  const formatted = `${(value * 100).toFixed(1)}%`;
  if (opts?.signed && value > 0) return `+${formatted}`;
  return formatted;
}

export function formatRelativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date("2026-04-26T00:00:00Z");
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function severityColor(
  severity: "low" | "medium" | "high" | "critical",
) {
  return {
    low: "sev-low",
    medium: "sev-med",
    high: "sev-high",
    critical: "sev-crit",
  }[severity];
}

export function severityEmoji(
  severity: "low" | "medium" | "high" | "critical",
) {
  return { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" }[severity];
}
