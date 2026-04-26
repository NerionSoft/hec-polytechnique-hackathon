"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

interface Props {
  email: string;
  name: string | null;
}

export function UserMenu({ email, name }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      router.replace("/sign-in");
      router.refresh();
    }
  }

  const initials = (name ?? email)
    .split(/[\s@.]+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-full px-2 py-1",
          "border-foreground/[0.08] bg-foreground/[0.03] border",
          "hover:bg-foreground/[0.06] transition-colors",
        )}
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            "bg-foreground/10 text-foreground/85 text-[10.5px] font-medium",
          )}
        >
          {initials || "·"}
        </span>
        <span className="text-foreground/85 hidden text-[12px] sm:block">{name ?? email}</span>
        <ChevronDown strokeWidth={1.6} className="text-foreground/55 size-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className={cn(
              "absolute top-[calc(100%+6px)] right-0 z-50 w-[260px]",
              "border-foreground/10 bg-surface rounded-[14px] border p-1.5",
              "shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]",
            )}
          >
            <div className="border-foreground/[0.08] border-b px-2.5 py-2">
              <p className="text-foreground text-[12.5px] font-medium">{name ?? email}</p>
              {name && <p className="text-foreground/55 text-[11px]">{email}</p>}
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={busy}
              className={cn(
                "mt-1 flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2",
                "text-foreground/75 text-[12.5px] transition-colors",
                "hover:bg-foreground/[0.04] hover:text-foreground disabled:opacity-50",
              )}
            >
              <LogOut strokeWidth={1.6} className="size-3.5" />
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
