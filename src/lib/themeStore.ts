"use client";

import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  init: () => void;
  toggle: () => void;
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("axis-theme", theme);
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: "light",
  init: () => {
    const saved = (localStorage.getItem("axis-theme") as Theme | null) ?? "light";
    apply(saved);
    set({ theme: saved });
  },
  toggle: () => {
    const next: Theme = get().theme === "light" ? "dark" : "light";
    apply(next);
    set({ theme: next });
  },
}));
