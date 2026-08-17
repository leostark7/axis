"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { useUndoStore } from "@/lib/undoStore";
import { Attachment, Demanda, DemandaComment, DemandaStatus, Profile, Reaction } from "./demandTypes";

const supabase = createClient();

type DemandaRow = {
  id: string;
  title: string;
  description: string | null;
  status: DemandaStatus;
  requested_by: string | null;
  assigned_to: string | null;
  due_date: string | null;
  start_time: string | null;
  end_time: string | null;
  attachments: Attachment[];
  reactions: Reaction[] | null;
  linked_item_id: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  demanda_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

function fromRow(row: DemandaRow): Demanda {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    requestedBy: row.requested_by,
    assignedTo: row.assigned_to,
    dueDate: row.due_date,
    startTime: row.start_time,
    endTime: row.end_time,
    attachments: row.attachments ?? [],
    reactions: row.reactions ?? [],
    linkedItemId: row.linked_item_id,
    clientId: row.client_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromCommentRow(row: CommentRow): DemandaComment {
  return {
    id: row.id,
    demandaId: row.demanda_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

interface DemandState {
  demandas: Demanda[];
  comments: Record<string, DemandaComment[]>;
  profiles: Profile[];
  loaded: boolean;
  init: () => Promise<void>;
  addDemanda: (input: {
    title: string;
    description?: string;
    assignedTo?: string | null;
    dueDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    clientId?: string | null;
  }) => Promise<void>;
  updateDemanda: (id: string, patch: Partial<Demanda>) => Promise<void>;
  removeDemanda: (id: string) => Promise<void>;
  addAttachment: (id: string, attachment: Attachment) => Promise<void>;
  removeAttachment: (id: string, url: string) => Promise<void>;
  loadComments: (demandaId: string) => Promise<void>;
  addComment: (demandaId: string, body: string) => Promise<void>;
  toggleReaction: (id: string, emoji: string) => Promise<void>;
}

let initPromise: Promise<void> | null = null;
const subscribedComments = new Set<string>();

function hasChannel(topic: string) {
  return supabase.getChannels().some((c) => c.topic === topic);
}

export const useDemandStore = create<DemandState>()((set, get) => ({
  demandas: [],
  comments: {},
  profiles: [],
  loaded: false,
  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const [{ data: demandas }, { data: profiles }] = await Promise.all([
        supabase.from("demandas").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
      ]);

      set({
        demandas: (demandas as DemandaRow[] | null)?.map(fromRow) ?? [],
        profiles: (profiles as Profile[] | null) ?? [],
        loaded: true,
      });

      if (!hasChannel("realtime:demandas-changes")) {
        const refresh = () =>
          supabase
            .from("demandas")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) set({ demandas: (data as DemandaRow[]).map(fromRow) });
            });

        supabase
          .channel("demandas-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "demandas" }, refresh)
          .subscribe();
      }
    })();
    return initPromise;
  },
  addDemanda: async (input) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("demandas").insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assigned_to: input.assignedTo ?? null,
      due_date: input.dueDate ?? null,
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      client_id: input.clientId ?? null,
      requested_by: user?.id ?? null,
    });
    logActivity("criou a demanda", "demanda", input.title.trim());
  },
  updateDemanda: async (id, patch) => {
    const before = get().demandas.find((d) => d.id === id);
    await supabase
      .from("demandas")
      .update({
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.assignedTo !== undefined && { assigned_to: patch.assignedTo }),
        ...(patch.dueDate !== undefined && { due_date: patch.dueDate }),
        ...(patch.startTime !== undefined && { start_time: patch.startTime }),
        ...(patch.endTime !== undefined && { end_time: patch.endTime }),
        ...(patch.attachments !== undefined && { attachments: patch.attachments }),
        ...(patch.reactions !== undefined && { reactions: patch.reactions }),
        ...(patch.linkedItemId !== undefined && { linked_item_id: patch.linkedItemId }),
        ...(patch.clientId !== undefined && { client_id: patch.clientId }),
      })
      .eq("id", id);
    if (before && patch.status !== undefined && patch.status !== before.status) {
      logActivity(`moveu a demanda para ${patch.status}`, "demanda", before.title, id);
    }
  },
  removeDemanda: async (id) => {
    const demanda = get().demandas.find((d) => d.id === id);
    await supabase.from("demandas").delete().eq("id", id);
    if (demanda) {
      logActivity("excluiu a demanda", "demanda", demanda.title);
      useUndoStore.getState().pushUndo(`Demanda "${demanda.title}" excluída`, () => {
        supabase.from("demandas").insert({
          title: demanda.title,
          description: demanda.description,
          status: demanda.status,
          assigned_to: demanda.assignedTo,
          due_date: demanda.dueDate,
          start_time: demanda.startTime,
          end_time: demanda.endTime,
          attachments: demanda.attachments,
          reactions: demanda.reactions,
          linked_item_id: demanda.linkedItemId,
          client_id: demanda.clientId,
        });
      });
    }
  },
  addAttachment: async (id, attachment) => {
    const demanda = get().demandas.find((d) => d.id === id);
    if (!demanda) return;
    await get().updateDemanda(id, { attachments: [...demanda.attachments, attachment] });
  },
  removeAttachment: async (id, url) => {
    const demanda = get().demandas.find((d) => d.id === id);
    if (!demanda) return;
    await get().updateDemanda(id, {
      attachments: demanda.attachments.filter((a) => a.url !== url),
    });
  },
  loadComments: async (demandaId) => {
    const { data } = await supabase
      .from("demanda_comments")
      .select("*")
      .eq("demanda_id", demandaId)
      .order("created_at", { ascending: true });
    set((s) => ({
      comments: { ...s.comments, [demandaId]: (data as CommentRow[] | null)?.map(fromCommentRow) ?? [] },
    }));

    if (subscribedComments.has(demandaId)) return;
    subscribedComments.add(demandaId);

    const refresh = async () => {
      const { data } = await supabase
        .from("demanda_comments")
        .select("*")
        .eq("demanda_id", demandaId)
        .order("created_at", { ascending: true });
      set((s) => ({
        comments: { ...s.comments, [demandaId]: (data as CommentRow[] | null)?.map(fromCommentRow) ?? [] },
      }));
    };

    supabase
      .channel(`demanda-comments-${demandaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "demanda_comments", filter: `demanda_id=eq.${demandaId}` },
        refresh
      )
      .subscribe();
  },
  addComment: async (demandaId, body) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("demanda_comments").insert({
      demanda_id: demandaId,
      author_id: user?.id ?? null,
      body: body.trim(),
    });
    const demanda = get().demandas.find((d) => d.id === demandaId);
    if (demanda) logActivity("comentou na demanda", "demanda", demanda.title, demandaId);
  },
  toggleReaction: async (id, emoji) => {
    const demanda = get().demandas.find((d) => d.id === id);
    if (!demanda) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const existing = demanda.reactions ?? [];
    const already = existing.some((r) => r.emoji === emoji && r.userId === user.id);
    const next = already
      ? existing.filter((r) => !(r.emoji === emoji && r.userId === user.id))
      : [...existing, { emoji, userId: user.id }];
    await get().updateDemanda(id, { reactions: next });
  },
}));
