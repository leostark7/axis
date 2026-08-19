"use client";

import { create } from "zustand";
import { ItemCategory } from "./types";

export type CategoryFilter = ItemCategory | "ambos";

interface CategoryFilterState {
  filter: CategoryFilter;
  init: () => void;
  setFilter: (filter: CategoryFilter) => void;
}

export const useCategoryFilterStore = create<CategoryFilterState>()((set) => ({
  filter: "empresarial",
  init: () => {
    const saved = localStorage.getItem("axis-category-filter") as CategoryFilter | null;
    if (saved === "empresarial" || saved === "pessoal" || saved === "ambos") {
      set({ filter: saved });
    }
  },
  setFilter: (filter) => {
    localStorage.setItem("axis-category-filter", filter);
    set({ filter });
  },
}));
