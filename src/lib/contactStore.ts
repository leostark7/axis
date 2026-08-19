"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { useUndoStore } from "@/lib/undoStore";
import { Contact, ContactCategory } from "./contactTypes";

const supabase = createClient();

type Row = {
  id: string;
  name: string;
  phone: string;
  category: ContactCategory;
  region: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: Row): Contact {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    category: row.category,
    region: row.region,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ContactState {
  contacts: Contact[];
  loaded: boolean;
  init: () => Promise<void>;
  addContact: (input: {
    name: string;
    phone: string;
    category?: ContactCategory;
    region?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  updateContact: (id: string, patch: Partial<Contact>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useContactStore = create<ContactState>()((set, get) => ({
  contacts: [],
  loaded: false,
  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const { data } = await supabase.from("contacts").select("*").order("name", { ascending: true });
      set({ contacts: (data as Row[] | null)?.map(fromRow) ?? [], loaded: true });

      const TOPIC = "realtime:contacts-changes";
      if (supabase.getChannels().some((c) => c.topic === TOPIC)) return;
      const refresh = () =>
        supabase
          .from("contacts")
          .select("*")
          .order("name", { ascending: true })
          .then(({ data }) => {
            if (data) set({ contacts: (data as Row[]).map(fromRow) });
          });
      supabase
        .channel("contacts-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, refresh)
        .subscribe();
    })();
    return initPromise;
  },
  addContact: async (input) => {
    await supabase.from("contacts").insert({
      name: input.name.trim(),
      phone: input.phone.trim(),
      category: input.category ?? "outro",
      region: input.region?.trim() || null,
      notes: input.notes?.trim() || null,
    });
    logActivity("cadastrou o contato", "item", input.name.trim());
  },
  updateContact: async (id, patch) => {
    await supabase
      .from("contacts")
      .update({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.phone !== undefined && { phone: patch.phone }),
        ...(patch.category !== undefined && { category: patch.category }),
        ...(patch.region !== undefined && { region: patch.region }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
      })
      .eq("id", id);
  },
  removeContact: async (id) => {
    const contact = get().contacts.find((c) => c.id === id);
    await supabase.from("contacts").delete().eq("id", id);
    if (contact) {
      logActivity("excluiu o contato", "item", contact.name);
      useUndoStore.getState().pushUndo(`Contato "${contact.name}" excluído`, () => {
        supabase.from("contacts").insert({
          name: contact.name,
          phone: contact.phone,
          category: contact.category,
          region: contact.region,
          notes: contact.notes,
        });
      });
    }
  },
}));
