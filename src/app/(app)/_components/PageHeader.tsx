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
        "flex flex-col gap-3 px-8 pt-8 pb-6",
        "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1
          className={cn(
            "font-serif text-[28px] leading-[1.1] font-normal",
            "text-foreground tracking-tight",
          )}
        >
          {title}
        </h1>
        {description && <p className="text-foreground/60 text-[13.5px]">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
