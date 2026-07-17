"use client";

import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  mobileNav: "tables" | "menu" | "order";
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNav: (nav: UiState["mobileNav"]) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  mobileNav: "tables",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobileNav: (mobileNav) => set({ mobileNav }),
}));
