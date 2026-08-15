"use client";

import { create } from "zustand";

interface ChatUiState {
  open: boolean;
  voiceTrigger: number;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  openWithVoice: () => void;
}

export const useChatUiStore = create<ChatUiState>()((set) => ({
  open: false,
  voiceTrigger: 0,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  openWithVoice: () => set((s) => ({ open: true, voiceTrigger: s.voiceTrigger + 1 })),
}));
