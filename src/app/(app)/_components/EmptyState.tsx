import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  badge,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-8 my-6 flex flex-col items-center justify-center gap-3",
        "rounded-[20px] border border-dashed border-foreground/[0.10]",
        "bg-foreground/[0.02] px-8 py-20 text-center",
        className,
      )}
    >
      {badge && (
        <span
          className={cn(
            "rounded-full border border-foreground/10 bg-foreground/[0.04]",
            "px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em]",
            "text-foreground/55",
          )}
        >
          {badge}
        </span>
      )}
      {Icon && (
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            "bg-foreground/[0.04] text-foreground/50",
          )}
        >
          <Icon strokeWidth={1.4} className="size-5" />
        </span>
      )}
      <p className="font-serif text-[20px] tracking-tight">{title}</p>
      {description && (
        <p className="max-w-[420px] text-[13px] text-foreground/55">
          {description}
        </p>
      )}
    </div>
  );
}
