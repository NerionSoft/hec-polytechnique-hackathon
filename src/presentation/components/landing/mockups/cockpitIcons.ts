import {
  BarChart3,
  CheckCircle2,
  FileText,
  FolderClosed,
  LayoutDashboard,
  Loader2,
  Search,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export const navIconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderClosed,
  Search,
  BarChart3,
  ShieldAlert,
  FileText,
  Settings,
};

export const agentIconMap = {
  done: CheckCircle2,
  running: Loader2,
} as const;
