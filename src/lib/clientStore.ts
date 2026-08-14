"use client";

import { create } from "zustand";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { useUndoStore } from "@/lib/undoStore";
import { Client, ClientStatus } from "./clientTypes";

const supabase = createSupabaseClient();

type Row = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: Row): Client {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ClientState {
  clients: Client[];
  loaded: boolean;
  init: () => Promise<void>;
  addClient: (input: { name: string; contactName?: string; contactEmail?: string; contactPhone?: string }) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useClientStore = create<ClientState>()((set, get) => ({
  clients: [],
  loaded: false,
  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const { data } = await supabase.from("clients").select("*").order("name", { ascending: true });
      set({ clients: (data as Row[] | null)?.map(fromRow) ?? [], loaded: true });

      const TOPIC = "realtime:clients-changes";
      if (supabase.getChannels().some((c) => c.topic === TOPIC)) return;
      const refresh = () =>
        supabase
          .from("clients")
          .select("*")
          .order("name", { ascending: true })
          .then(({ data }) => {
            if (data) set({ clients: (data as Row[]).map(fromRow) });
          });
      supabase
        .channel("clients-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, refresh)
        .subscribe();
    })();
    return initPromise;
  },
  addClient: async (input) => {
    await supabase.from("clients").insert({
      name: input.name.trim(),
      contact_name: input.contactName?.trim() || null,
      contact_email: input.contactEmail?.trim() || null,
      contact_phone: input.contactPhone?.trim() || null,
    });
    logActivity("cadastrou o cliente", "cliente", input.name.trim());
  },
  updateClient: async (id, patch) => {
    await supabase
      .from("clients")
      .update({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.contactName !== undefined && { contact_name: patch.contactName }),
        ...(patch.contactEmail !== undefined && { contact_email: patch.contactEmail }),
        ...(patch.contactPhone !== undefined && { contact_phone: patch.contactPhone }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
      })
      .eq("id", id);
  },
  removeClient: async (id) => {
    const client = get().clients.find((c) => c.id === id);
    await supabase.from("clients").delete().eq("id", id);
    if (client) {
      logActivity("excluiu o cliente", "cliente", client.name);
      useUndoStore.getState().pushUndo(`Cliente "${client.name}" excluído`, () => {
        supabase.from("clients").insert({
          name: client.name,
          contact_name: client.contactName,
          contact_email: client.contactEmail,
          contact_phone: client.contactPhone,
          status: client.status,
          notes: client.notes,
        });
      });
    }
  },
}));
