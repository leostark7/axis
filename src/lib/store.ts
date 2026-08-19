"use client";

import { create } from "zustand";
import { addDays, addMonths, addWeeks, format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { useUndoStore } from "@/lib/undoStore";
import { Item, ItemCategory, ItemType, Reaction, RecurrenceFreq, RECURRENCE_LABEL, ScriptStage } from "./types";

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
  recurring_group_id: string | null;
  recurrence_label: string | null;
  client_id: string | null;
  category: ItemCategory;
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
    recurringGroupId: row.recurring_group_id,
    recurrenceLabel: row.recurrence_label,
    clientId: row.client_id,
    category: row.category ?? "empresarial",
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
    clientId?: string | null;
    category?: ItemCategory;
  }) => Promise<void>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  scheduleItem: (id: string, date: string | null) => Promise<void>;
  setScriptStage: (id: string, stage: ScriptStage) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  toggleReaction: (id: string, emoji: string) => Promise<void>;
  applyRecurrence: (id: string, freq: RecurrenceFreq, occurrences: number) => Promise<void>;
  removeSeries: (recurringGroupId: string) => Promise<void>;
  bulkSchedule: (ids: string[], date: string | null) => Promise<void>;
  bulkRemove: (ids: string[]) => Promise<void>;
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
      client_id: input.clientId ?? null,
      category: input.category ?? "empresarial",
      created_by: user?.id ?? null,
    });
    logActivity("criou", "item", input.title.trim());
  },
  updateItem: async (id, patch) => {
    await supabase
      .from("items")
      .update({
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
        ...(patch.date !== undefined && { date: patch.date, reminded_at: null }),
        ...(patch.time !== undefined && { time: patch.time, reminded_at: null }),
        ...(patch.done !== undefined && { done: patch.done }),
        ...(patch.scriptStage !== undefined && { script_stage: patch.scriptStage }),
        ...(patch.reactions !== undefined && { reactions: patch.reactions }),
        ...(patch.recurringGroupId !== undefined && { recurring_group_id: patch.recurringGroupId }),
        ...(patch.recurrenceLabel !== undefined && { recurrence_label: patch.recurrenceLabel }),
        ...(patch.clientId !== undefined && { client_id: patch.clientId }),
        ...(patch.category !== undefined && { category: patch.category }),
      })
      .eq("id", id);
  },
  removeItem: async (id) => {
    const item = get().items.find((it) => it.id === id);
    await supabase.from("items").delete().eq("id", id);
    if (item) {
      logActivity("excluiu", "item", item.title);
      useUndoStore.getState().pushUndo(`Item "${item.title}" excluído`, () => {
        supabase.from("items").insert({
          title: item.title,
          type: item.type,
          date: item.date,
          time: item.time,
          notes: item.notes ?? null,
          script_stage: item.scriptStage ?? null,
          done: item.done ?? false,
          reactions: item.reactions ?? [],
        });
      });
    }
  },
  scheduleItem: async (id, date) => {
    await get().updateItem(id, { date });
  },
  setScriptStage: async (id, stage) => {
    const item = get().items.find((it) => it.id === id);
    await get().updateItem(id, { scriptStage: stage });
    if (item) logActivity(`moveu para ${stage}`, "item", item.title, id);
  },
  toggleDone: async (id) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;
    await get().updateItem(id, { done: !item.done });
    logActivity(item.done ? "reabriu" : "concluiu", "item", item.title, id);
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
  applyRecurrence: async (id, freq, occurrences) => {
    const item = get().items.find((it) => it.id === id);
    if (!item || !item.date) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const groupId = crypto.randomUUID();
    const step = (d: Date) =>
      freq === "daily" ? addDays(d, 1) : freq === "weekly" ? addWeeks(d, 1) : addMonths(d, 1);

    let cursor = new Date(item.date + "T00:00:00");
    const rows = [];
    for (let i = 0; i < occurrences; i++) {
      cursor = step(cursor);
      rows.push({
        title: item.title,
        type: item.type,
        date: format(cursor, "yyyy-MM-dd"),
        time: item.time ?? null,
        notes: item.notes ?? null,
        script_stage: item.type === "script" ? "rascunho" : null,
        created_by: user?.id ?? null,
        recurring_group_id: groupId,
        recurrence_label: RECURRENCE_LABEL[freq],
      });
    }

    await supabase.from("items").insert(rows);
    await get().updateItem(id, { recurringGroupId: groupId, recurrenceLabel: RECURRENCE_LABEL[freq] });
    logActivity(`ativou repetição (${RECURRENCE_LABEL[freq].toLowerCase()})`, "item", item.title, id);
  },
  removeSeries: async (recurringGroupId) => {
    await supabase.from("items").delete().eq("recurring_group_id", recurringGroupId);
    logActivity("excluiu a série inteira de", "item", "itens recorrentes");
  },
  bulkSchedule: async (ids, date) => {
    await supabase.from("items").update({ date }).in("id", ids);
    logActivity(`reagendou ${ids.length} itens`, "item", date ?? "backlog");
  },
  bulkRemove: async (ids) => {
    const removed = get().items.filter((it) => ids.includes(it.id));
    if (removed.length === 0) return;
    await supabase.from("items").delete().in("id", ids);
    logActivity(`excluiu ${removed.length} itens`, "item", removed.map((r) => r.title).join(", "));
    useUndoStore.getState().pushUndo(`${removed.length} itens excluídos`, () => {
      supabase.from("items").insert(
        removed.map((item) => ({
          title: item.title,
          type: item.type,
          date: item.date,
          time: item.time,
          notes: item.notes ?? null,
          script_stage: item.scriptStage ?? null,
          done: item.done ?? false,
          reactions: item.reactions ?? [],
        }))
      );
    });
  },
}));
