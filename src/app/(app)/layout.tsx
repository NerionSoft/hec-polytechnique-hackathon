import { Sidebar } from "./_components/Sidebar";
import { Topbar } from "./_components/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <div className="pl-[240px]">
        <Topbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </div>
    </div>
  );
}
