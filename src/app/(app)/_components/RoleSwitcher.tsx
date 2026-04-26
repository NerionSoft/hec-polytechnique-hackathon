"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { team, type Role } from "@/src/lib/mock/fund";
import { useRoleStore } from "@/src/lib/stores/role-store";

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const { user, setRole } = useRoleStore();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2.5 rounded-full px-2 py-1",
          "border-foreground/[0.08] bg-foreground/[0.03] border",
          "hover:bg-foreground/[0.06] transition-colors",
        )}
      >
        <Avatar member={user} />
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-[12.5px] font-medium">{user.name}</p>
          <p className="text-foreground/55 text-[10.5px]">{user.role}</p>
        </div>
        <ChevronDown strokeWidth={1.6} className="text-foreground/55 size-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className={cn(
              "absolute top-[calc(100%+6px)] right-0 z-50 w-[260px]",
              "border-foreground/10 bg-surface rounded-[14px] border",
              "p-1.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]",
            )}
          >
            <p
              className={cn(
                "px-2.5 pt-2 pb-1.5 text-[10.5px] uppercase",
                "text-foreground/40 tracking-[0.14em]",
              )}
            >
              View as
            </p>
            {team.map((member) => {
              const active = member.id === user.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setRole(member.role as Role);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2",
                    "text-left transition-colors",
                    active ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]",
                  )}
                >
                  <Avatar member={member} />
                  <div className="flex-1 leading-tight">
                    <p className="text-[12.5px] font-medium">{member.name}</p>
                    <p className="text-foreground/55 text-[10.5px]">{member.role}</p>
                  </div>
                  {active && <Check strokeWidth={2} className="text-foreground/70 size-3.5" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ member }: { member: { initials: string; avatarHue: number } }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center",
        "rounded-full text-[10.5px] font-medium tracking-tight",
        "text-foreground",
      )}
      style={{
        background: `hsl(${member.avatarHue} 60% 35%)`,
      }}
    >
      {member.initials}
    </span>
  );
}
