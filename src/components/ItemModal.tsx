"use client";

import { useEffect, useState } from "react";
import { Item, ItemType, RECURRENCE_LABEL, RecurrenceFreq, TYPE_LABEL } from "@/lib/types";
import { useAxisStore } from "@/lib/store";
import { useClientStore } from "@/lib/clientStore";
import ReactionBar from "./ReactionBar";
import { X, Trash2, CalendarPlus, Repeat, Building2 } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];
const FREQS: RecurrenceFreq[] = ["daily", "weekly", "monthly"];

export default function ItemModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const updateItem = useAxisStore((s) => s.updateItem);
  const removeItem = useAxisStore((s) => s.removeItem);
  const scheduleItem = useAxisStore((s) => s.scheduleItem);
  const toggleReaction = useAxisStore((s) => s.toggleReaction);
  const applyRecurrence = useAxisStore((s) => s.applyRecurrence);
  const removeSeries = useAxisStore((s) => s.removeSeries);
  const clients = useClientStore((s) => s.clients);
  const initClients = useClientStore((s) => s.init);

  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [type, setType] = useState<ItemType>(item.type);
  const [date, setDate] = useState(item.date ?? "");
  const [time, setTime] = useState(item.time ?? "");
  const [freq, setFreq] = useState<RecurrenceFreq>("weekly");
  const [applyingRecurrence, setApplyingRecurrence] = useState(false);
  const [clientId, setClientId] = useState(item.clientId ?? "");

  useEffect(() => {
    setTitle(item.title);
    setNotes(item.notes ?? "");
    setType(item.type);
    setDate(item.date ?? "");
    setTime(item.time ?? "");
    setClientId(item.clientId ?? "");
  }, [item]);

  useEffect(() => {
    initClients();
  }, [initClients]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  async function handleSave() {
    await updateItem(item.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      date: date || null,
      time: time || null,
      clientId: clientId || null,
    });
    onClose();
  }

  async function handleDelete() {
    await removeItem(item.id);
    onClose();
  }

  async function handleApplyRecurrence() {
    if (!date) return;
    setApplyingRecurrence(true);
    await applyRecurrence(item.id, freq, 12);
    setApplyingRecurrence(false);
  }

  async function handleDeleteSeries() {
    if (!item.recurringGroupId) return;
    await removeSeries(item.recurringGroupId);
    onClose();
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101a2e]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#101a2e]/60">
            Editar {TYPE_LABEL[type]}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10 hover:text-[#101a2e]"
          >
            <X size={16} />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-sm font-medium text-[#101a2e] outline-none focus:border-blue-400"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={type === "script" ? "Escreva o roteiro aqui (é o que o teleprompter vai ler)..." : "Notas (opcional)"}
          rows={type === "script" ? 8 : 3}
          className="mb-3 w-full resize-none rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-sm text-[#101a2e] outline-none placeholder-[#101a2e]/35 focus:border-blue-400"
        />

        <div className="mb-3 grid grid-cols-3 gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ItemType)}
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-2 py-2.5 text-xs font-medium text-[#101a2e] outline-none"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-2 py-2.5 text-xs text-[#101a2e] outline-none"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-2 py-2.5 text-xs text-[#101a2e] outline-none"
          />
        </div>

        <div className="mb-3">
          <ReactionBar reactions={item.reactions ?? []} onToggle={(emoji) => toggleReaction(item.id, emoji)} />
        </div>

        <div className="mb-3">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
            <Building2 size={12} />
            Cliente
          </span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
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

        {date && (
          <div className="mb-3 rounded-xl border border-[#101a2e]/10 bg-[#101a2e]/[0.03] p-3">
            {item.recurringGroupId ? (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-blue-600">
                  <Repeat size={13} />
                  Repete {item.recurrenceLabel?.toLowerCase()}
                </span>
                <button
                  onClick={handleDeleteSeries}
                  className="font-medium text-red-500 hover:underline"
                >
                  Excluir série inteira
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Repeat size={13} className="shrink-0 text-[#101a2e]/40" />
                <select
                  value={freq}
                  onChange={(e) => setFreq(e.target.value as RecurrenceFreq)}
                  className="flex-1 rounded-lg bg-white/70 px-2 py-1.5 text-xs text-[#101a2e] outline-none"
                >
                  {FREQS.map((f) => (
                    <option key={f} value={f}>
                      {RECURRENCE_LABEL[f]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleApplyRecurrence}
                  disabled={applyingRecurrence}
                  className="shrink-0 rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-60"
                >
                  {applyingRecurrence ? "Aplicando..." : "Repetir (12x)"}
                </button>
              </div>
            )}
          </div>
        )}

        {!date && (
          <button
            onClick={() => setDate(new Date().toISOString().slice(0, 10))}
            className="mb-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
          >
            <CalendarPlus size={13} />
            Agendar para hoje
          </button>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} />
            Excluir
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] hover:brightness-110"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
