"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  FolderLock,
  Gavel,
  History,
  LayoutDashboard,
  MessageSquareQuote,
  Sparkles,
  TrendingUp,
  Lock,
} from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { Stage } from "@/src/lib/mock/deals";
import { stages } from "@/src/lib/mock/deals";

type TabDef = {
  slug: string;
  label: string;
  icon: typeof LayoutDashboard;
  unlocksAt?: Stage;
  badge?: string;
};

const TABS: TabDef[] = [
  { slug: "overview", label: "Overview", icon: LayoutDashboard },
  { slug: "enrichment", label: "Enrichment", icon: Sparkles },
  { slug: "data-room", label: "Data Room", icon: FolderLock, unlocksAt: "engaged" },
  { slug: "financials", label: "Financials", icon: TrendingUp, unlocksAt: "in_dd" },
  { slug: "risks", label: "Risks", icon: AlertTriangle, unlocksAt: "in_dd", badge: "warn" },
  { slug: "questions", label: "Questions", icon: MessageSquareQuote, unlocksAt: "in_dd" },
  { slug: "memo", label: "Memo", icon: FileText, unlocksAt: "in_dd" },
  { slug: "decision", label: "Decision", icon: Gavel, unlocksAt: "decided" },
  { slug: "audit", label: "Audit", icon: History },
];

export function DealTabs({
  dealId,
  currentStage,
  redFlagCount,
}: {
  dealId: string;
  currentStage: Stage;
  redFlagCount: number;
}) {
  const pathname = usePathname();
  const stageIndex = stages.indexOf(currentStage);

  return (
    <div
      className={cn(
        "border-foreground/[0.08] sticky top-16 z-10 border-b",
        "bg-background/85 px-8 backdrop-blur-[34px]",
      )}
    >
      <nav className="-mx-1 flex items-center gap-0.5 overflow-x-auto">
        {TABS.map((tab) => {
          const unlocked = !tab.unlocksAt || stages.indexOf(tab.unlocksAt) <= stageIndex;
          const href = `/pipeline/${dealId}/${tab.slug}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          const Icon = tab.icon;
          const showBadge = tab.badge === "warn" && redFlagCount > 0;

          if (!unlocked) {
            return (
              <span
                key={tab.slug}
                title={`Unlocks at "${tab.unlocksAt}" stage`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-3.5 text-[12.5px]",
                  "text-foreground/30",
                )}
              >
                <Lock strokeWidth={1.6} className="size-3.5" />
                {tab.label}
              </span>
            );
          }

          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-3.5 text-[12.5px]",
                "transition-colors",
                active ? "text-foreground" : "text-foreground/55 hover:text-foreground/85",
              )}
            >
              <Icon strokeWidth={1.6} className="size-3.5" />
              {tab.label}
              {showBadge && (
                <span
                  className={cn(
                    "ml-0.5 flex h-4 min-w-4 items-center justify-center px-1",
                    "bg-warm/15 tabular text-warm rounded-full text-[9.5px] font-medium",
                  )}
                >
                  {redFlagCount}
                </span>
              )}
              {active && (
                <span className={cn("bg-foreground absolute inset-x-2 -bottom-px h-px")} />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
