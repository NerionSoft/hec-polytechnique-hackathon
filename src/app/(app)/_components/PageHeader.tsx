import { cn } from "@/src/presentation/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6",
        "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1
          className={cn(
            "font-serif leading-[1.1] font-normal",
            "text-foreground tracking-tight",
            "text-[24px] sm:text-[28px]",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="text-foreground/60 text-[12.5px] sm:text-[13.5px]">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
