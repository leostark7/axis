"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activityLog";

const supabase = createClient();

export interface AxisDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  category: string;
  clientId: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

type Row = {
  id: string;
  name: string;
  url: string;
  size: number;
  category: string;
  client_id: string | null;
  uploaded_by: string | null;
  created_at: string;
};

function fromRow(row: Row): AxisDocument {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    size: row.size,
    category: row.category,
    clientId: row.client_id,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

interface DocumentState {
  documents: AxisDocument[];
  loaded: boolean;
  init: () => Promise<void>;
  addDocument: (input: { name: string; url: string; size: number; category?: string; clientId?: string | null }) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  documents: [],
  loaded: false,
  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      set({ documents: (data as Row[] | null)?.map(fromRow) ?? [], loaded: true });

      const TOPIC = "realtime:documents-changes";
      if (supabase.getChannels().some((c) => c.topic === TOPIC)) return;
      const refresh = () =>
        supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            if (data) set({ documents: (data as Row[]).map(fromRow) });
          });
      supabase
        .channel("documents-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, refresh)
        .subscribe();
    })();
    return initPromise;
  },
  addDocument: async (input) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("documents").insert({
      name: input.name,
      url: input.url,
      size: input.size,
      category: input.category ?? "geral",
      client_id: input.clientId ?? null,
      uploaded_by: user?.id ?? null,
    });
    logActivity("subiu o documento", "item", input.name);
  },
  removeDocument: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    await supabase.from("documents").delete().eq("id", id);
    if (doc) logActivity("excluiu o documento", "item", doc.name);
  },
}));
