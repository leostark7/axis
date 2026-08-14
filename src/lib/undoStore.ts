"use client";

import { create } from "zustand";

interface UndoState {
  id: number;
  message: string;
  onUndo: (() => void) | null;
  pushUndo: (message: string, onUndo: () => void) => void;
  clear: () => void;
}

let counter = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

export const useUndoStore = create<UndoState>()((set) => ({
  id: 0,
  message: "",
  onUndo: null,
  pushUndo: (message, onUndo) => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = ++counter;
    set({ id, message, onUndo });
    timeoutId = setTimeout(() => {
      set((s) => (s.id === id ? { onUndo: null } : {}));
    }, 6000);
  },
  clear: () => {
    if (timeoutId) clearTimeout(timeoutId);
    set({ onUndo: null });
  },
}));
