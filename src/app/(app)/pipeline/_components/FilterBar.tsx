import { Filter, Users } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { ViewToggle } from "./ViewToggle";
import { NewDealButton } from "./NewDealButton";

export function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 px-8 pb-4">
      <ViewToggle />
      <FilterPill icon={Filter} label="Sector" value="All" />
      <FilterPill icon={Users} label="Owner" value="Anyone" />
      <div className="ml-auto">
        <NewDealButton />
      </div>
    </div>
  );
}

function FilterPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Filter;
  label: string;
  value: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 rounded-full",
        "border-foreground/[0.08] bg-foreground/[0.02] border px-3 py-1.5",
        "text-foreground/65 text-[12px] transition-colors",
        "hover:bg-foreground/[0.05] hover:text-foreground",
      )}
    >
      <Icon strokeWidth={1.6} className="size-3.5" />
      <span className="text-foreground/45">{label}:</span>
      <span>{value}</span>
    </button>
  );
}
