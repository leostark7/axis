"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Message {
  id: string;
  senderId: string | null;
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
}

type Row = {
  id: string;
  sender_id: string | null;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
};

function fromRow(row: Row): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    body: row.body,
    attachmentUrl: row.attachment_url,
    attachmentName: row.attachment_name,
    createdAt: row.created_at,
  };
}

interface MessageState {
  messages: Message[];
  loaded: boolean;
  init: () => Promise<void>;
  sendMessage: (input: { body?: string; attachmentUrl?: string; attachmentName?: string }) => Promise<void>;
  removeMessage: (id: string) => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useMessageStore = create<MessageState>()((set) => ({
  messages: [],
  loaded: false,
  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(300);
      set({ messages: (data as Row[] | null)?.map(fromRow) ?? [], loaded: true });

      const TOPIC = "realtime:messages-changes";
      if (supabase.getChannels().some((c) => c.topic === TOPIC)) return;
      supabase
        .channel("messages-changes")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          set((s) => ({ messages: [...s.messages, fromRow(payload.new as Row)] }));
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
          set((s) => ({ messages: s.messages.filter((m) => m.id !== (payload.old as Row).id) }));
        })
        .subscribe();
    })();
    return initPromise;
  },
  sendMessage: async (input) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("messages").insert({
      sender_id: user?.id ?? null,
      body: input.body?.trim() || null,
      attachment_url: input.attachmentUrl ?? null,
      attachment_name: input.attachmentName ?? null,
    });
  },
  removeMessage: async (id) => {
    await supabase.from("messages").delete().eq("id", id);
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) }));
  },
}));
