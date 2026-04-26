import { cn } from "@/src/presentation/lib/cn";
import { PageHeader } from "../_components/PageHeader";
import { SettingsNav } from "./_components/SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure scoring, team permissions, sources and review the audit trail."
      />
      <div className="grid grid-cols-1 gap-6 px-4 pb-12 sm:px-8 lg:grid-cols-[200px_1fr]">
        <aside
          className={cn("border-foreground/[0.08] bg-surface/40 h-max rounded-[16px] border p-2")}
        >
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
