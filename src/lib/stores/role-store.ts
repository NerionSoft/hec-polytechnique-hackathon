"use client";

import { create } from "zustand";
import type { Role } from "@/src/lib/mock/fund";
import { team, type TeamMember } from "@/src/lib/mock/fund";

type RoleStore = {
  user: TeamMember;
  setRole: (role: Role) => void;
};

const userByRole: Record<Role, TeamMember> = team.reduce(
  (acc, m) => {
    acc[m.role] = m;
    return acc;
  },
  {} as Record<Role, TeamMember>,
);

export const useRoleStore = create<RoleStore>((set) => ({
  user: team[2],
  setRole: (role) => set({ user: userByRole[role] }),
}));
