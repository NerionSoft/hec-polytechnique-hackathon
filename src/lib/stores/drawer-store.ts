"use client";

import { create } from "zustand";

type DrawerStore = {
  citationId: string | null;
  open: (id: string) => void;
  close: () => void;
};

export const useDrawerStore = create<DrawerStore>((set) => ({
  citationId: null,
  open: (id) => set({ citationId: id }),
  close: () => set({ citationId: null }),
}));
