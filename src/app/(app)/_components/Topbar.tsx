import { cn } from "@/src/presentation/lib/cn";
import { ThesisSwitcher, type ThesisSummary } from "./ThesisSwitcher";
import { UserMenu } from "./UserMenu";
import { MenuToggle } from "./MenuToggle";

interface TopbarProps {
  theses: ThesisSummary[];
  selectedThesisId: string | null;
  user: { email: string; name: string | null };
}

export function Topbar({ theses, selectedThesisId, user }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-3",
        "border-foreground/[0.08] bg-background/70 border-b",
        "px-4 backdrop-blur-[34px] sm:px-6",
      )}
    >
      <MenuToggle />
      <div className="flex flex-1 items-center" />

      <div className="flex items-center gap-2">
        <ThesisSwitcher theses={theses} selectedThesisId={selectedThesisId} />
        <UserMenu email={user.email} name={user.name} />
      </div>
    </header>
  );
}
