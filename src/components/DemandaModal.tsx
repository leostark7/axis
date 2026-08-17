"use client";

import { useEffect, useRef, useState } from "react";
import { useDemandStore } from "@/lib/demandStore";
import { useAxisStore } from "@/lib/store";
import { useClientStore } from "@/lib/clientStore";
import { createClient } from "@/lib/supabase/client";
import { Demanda, DEMANDA_STATUS_LABEL, DemandaStatus } from "@/lib/demandTypes";
import { TYPE_LABEL } from "@/lib/types";
import ReactionBar from "./ReactionBar";
import AttachmentPreview from "./AttachmentPreview";
import { isFileTooLarge } from "@/lib/uploadLimits";
import { X, Trash2, Paperclip, Loader2, Send, Link2, Building2, Clock } from "lucide-react";

const STATUSES: DemandaStatus[] = ["aberta", "andamento", "concluida"];
const supabase = createClient();

export default function DemandaModal({ demanda, onClose }: { demanda: Demanda; onClose: () => void }) {
  const updateDemanda = useDemandStore((s) => s.updateDemanda);
  const removeDemanda = useDemandStore((s) => s.removeDemanda);
  const addAttachment = useDemandStore((s) => s.addAttachment);
  const removeAttachment = useDemandStore((s) => s.removeAttachment);
  const profiles = useDemandStore((s) => s.profiles);
  const loadComments = useDemandStore((s) => s.loadComments);
  const addComment = useDemandStore((s) => s.addComment);
  const toggleReaction = useDemandStore((s) => s.toggleReaction);
  const comments = useDemandStore((s) => s.comments[demanda.id] ?? []);
  const items = useAxisStore((s) => s.items);
  const clients = useClientStore((s) => s.clients);
  const initClients = useClientStore((s) => s.init);

  const [title, setTitle] = useState(demanda.title);
  const [description, setDescription] = useState(demanda.description ?? "");
  const [assignedTo, setAssignedTo] = useState(demanda.assignedTo ?? "");
  const [dueDate, setDueDate] = useState(demanda.dueDate ?? "");
  const [startTime, setStartTime] = useState(demanda.startTime ?? "");
  const [endTime, setEndTime] = useState(demanda.endTime ?? "");
  const [status, setStatus] = useState(demanda.status);
  const [uploading, setUploading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [linkedItemId, setLinkedItemId] = useState(demanda.linkedItemId ?? "");
  const [clientId, setClientId] = useState(demanda.clientId ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments(demanda.id);
    initClients();
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, [demanda.id, loadComments, initClients]);

  async function persist(patch: Partial<Demanda>) {
    await updateDemanda(demanda.id, patch);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isFileTooLarge(file)) {
      alert("Arquivo maior que 20 MB. Escolha um arquivo menor.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    const path = `${demanda.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("demandas").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("demandas").getPublicUrl(path);
      await addAttachment(demanda.id, { name: file.name, url: data.publicUrl, size: file.size });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSendComment() {
    if (!commentText.trim()) return;
    await addComment(demanda.id, commentText);
    setCommentText("");
  }

  function emailFor(id: string | null) {
    if (!id) return "—";
    return profiles.find((p) => p.id === id)?.email ?? "—";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101a2e]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#101a2e]/10 px-6 py-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#101a2e]/60">
            Demanda
          </span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persist({ title })}
            className="mb-3 w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-base font-semibold text-[#101a2e] outline-none focus:border-blue-400"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => persist({ description })}
            placeholder="Descreva a demanda..."
            rows={3}
            className="mb-3 w-full resize-none rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-sm text-[#101a2e] outline-none placeholder-[#101a2e]/35 focus:border-blue-400"
          />

          <div className="mb-4 grid grid-cols-3 gap-2">
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value as DemandaStatus;
                setStatus(v);
                persist({ status: v });
              }}
              className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-2 py-2.5 text-xs font-medium text-[#101a2e] outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {DEMANDA_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value);
                persist({ assignedTo: e.target.value || null });
              }}
              className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-2 py-2.5 text-xs font-medium text-[#101a2e] outline-none"
            >
              <option value="">Sem responsável</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                persist({ dueDate: e.target.value || null });
              }}
              className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-2 py-2.5 text-xs text-[#101a2e] outline-none"
            />
          </div>

          <div className="mb-4">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              <Clock size={12} />
              Horário de início e fim
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  persist({ startTime: e.target.value || null });
                }}
                placeholder="Início"
                className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  persist({ endTime: e.target.value || null });
                }}
                placeholder="Fim"
                className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <ReactionBar
              reactions={demanda.reactions ?? []}
              onToggle={(emoji) => toggleReaction(demanda.id, emoji)}
            />
          </div>

          <div className="mb-4">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              <Building2 size={12} />
              Cliente
            </span>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                persist({ clientId: e.target.value || null });
              }}
              className="w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
            >
              <option value="">Nenhum</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              <Link2 size={12} />
              Vincular a um item
            </span>
            <select
              value={linkedItemId}
              onChange={(e) => {
                setLinkedItemId(e.target.value);
                persist({ linkedItemId: e.target.value || null });
              }}
              className="w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
            >
              <option value="">Nenhum</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {TYPE_LABEL[it.type]} · {it.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
                Anexos
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg border border-[#101a2e]/15 px-2.5 py-1.5 text-xs font-medium text-[#101a2e]/70 hover:bg-[#101a2e]/5 disabled:opacity-60"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
                Anexar arquivo
              </button>
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
            </div>
            <div className="flex flex-col gap-1.5">
              {demanda.attachments.length === 0 && (
                <p className="text-xs text-[#101a2e]/50">Nenhum arquivo anexado.</p>
              )}
              {demanda.attachments.map((a) => (
                <AttachmentPreview key={a.url} attachment={a} onRemove={() => removeAttachment(demanda.id, a.url)} />
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              Atualizações
            </span>
            <div className="mb-2 flex flex-col gap-2">
              {comments.length === 0 && (
                <p className="text-xs text-[#101a2e]/50">Nenhum comentário ainda.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-[#101a2e]/5 px-3 py-2 text-xs">
                  <div className="mb-0.5 font-semibold text-[#101a2e]/70">
                    {c.authorId === myId ? "Você" : emailFor(c.authorId)}
                  </div>
                  <div className="text-[#101a2e]/70">{c.body}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                placeholder="Escreva uma atualização..."
                className="min-w-0 flex-1 rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none focus:border-blue-400"
              />
              <button
                onClick={handleSendComment}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-2 text-white"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#101a2e]/10 px-6 py-3">
          <button
            onClick={async () => {
              await removeDemanda(demanda.id);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} />
            Excluir demanda
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] hover:brightness-110"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
