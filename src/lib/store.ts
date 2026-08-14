"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { Item, ItemType, Reaction, ScriptStage } from "./types";

const supabase = createClient();

type Row = {
  id: string;
  title: string;
  notes: string | null;
  type: ItemType;
  date: string | null;
  time: string | null;
  script_stage: ScriptStage | null;
  done: boolean;
  created_at: string;
  updated_at: string;
  reactions: Reaction[] | null;
};

function fromRow(row: Row): Item {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    type: row.type,
    date: row.date,
    time: row.time,
    scriptStage: row.script_stage ?? undefined,
    done: row.done,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reactions: row.reactions ?? [],
  };
}

interface AxisState {
  items: Item[];
  loading: boolean;
  loaded: boolean;
  init: () => Promise<void>;
  addItem: (input: {
    title: string;
    type: ItemType;
    date?: string | null;
    time?: string | null;
    notes?: string;
  }) => Promise<void>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  scheduleItem: (id: string, date: string | null) => Promise<void>;
  setScriptStage: (id: string, stage: ScriptStage) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  toggleReaction: (id: string, emoji: string) => Promise<void>;
}

let initPromise: Promise<void> | null = null;

function ensureSubscribed(set: (partial: Partial<AxisState>) => void) {
  const CHANNEL_TOPIC = "realtime:items-changes";
  if (supabase.getChannels().some((c) => c.topic === CHANNEL_TOPIC)) return;
  supabase
    .channel("items-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
      supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) set({ items: (data as Row[]).map(fromRow) });
        });
    })
    .subscribe();
}

export const useAxisStore = create<AxisState>()((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      set({ loading: true });

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        set({ items: (data as Row[]).map(fromRow) });
      }
      set({ loading: false, loaded: true });

      ensureSubscribed(set);
    })();
    return initPromise;
  },
  addItem: async (input) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("items").insert({
      title: input.title.trim(),
      type: input.type,
      date: input.date ?? null,
      time: input.time ?? null,
      notes: input.notes ?? null,
      script_stage: input.type === "script" ? "rascunho" : null,
      created_by: user?.id ?? null,
    });
  },
  updateItem: async (id, patch) => {
    await supabase
      .from("items")
      .update({
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
        ...(patch.date !== undefined && { date: patch.date }),
        ...(patch.time !== undefined && { time: patch.time }),
        ...(patch.done !== undefined && { done: patch.done }),
        ...(patch.scriptStage !== undefined && { script_stage: patch.scriptStage }),
        ...(patch.reactions !== undefined && { reactions: patch.reactions }),
      })
      .eq("id", id);
  },
  removeItem: async (id) => {
    await supabase.from("items").delete().eq("id", id);
  },
  scheduleItem: async (id, date) => {
    await get().updateItem(id, { date });
  },
  setScriptStage: async (id, stage) => {
    await get().updateItem(id, { scriptStage: stage });
  },
  toggleDone: async (id) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;
    await get().updateItem(id, { done: !item.done });
  },
  toggleReaction: async (id, emoji) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const existing = item.reactions ?? [];
    const already = existing.some((r) => r.emoji === emoji && r.userId === user.id);
    const next = already
      ? existing.filter((r) => !(r.emoji === emoji && r.userId === user.id))
      : [...existing, { emoji, userId: user.id }];
    await get().updateItem(id, { reactions: next });
  },
}));
