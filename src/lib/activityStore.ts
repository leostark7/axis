"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface ActivityEntry {
  id: string;
  actorId: string | null;
  verb: string;
  entityType: "item" | "demanda";
  entityTitle: string;
  entityId: string | null;
  createdAt: string;
}

type Row = {
  id: string;
  actor_id: string | null;
  verb: string;
  entity_type: "item" | "demanda";
  entity_title: string;
  entity_id: string | null;
  created_at: string;
};

function fromRow(row: Row): ActivityEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    verb: row.verb,
    entityType: row.entity_type,
    entityTitle: row.entity_title,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}

interface ActivityState {
  entries: ActivityEntry[];
  loaded: boolean;
  init: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useActivityStore = create<ActivityState>()((set) => ({
  entries: [],
  loaded: false,
  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      set({ entries: (data as Row[] | null)?.map(fromRow) ?? [], loaded: true });

      const CHANNEL_TOPIC = "realtime:activity-changes";
      if (supabase.getChannels().some((c) => c.topic === CHANNEL_TOPIC)) return;
      supabase
        .channel("activity-changes")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
          set((s) => ({ entries: [fromRow(payload.new as Row), ...s.entries].slice(0, 200) }));
        })
        .subscribe();
    })();
    return initPromise;
  },
}));
