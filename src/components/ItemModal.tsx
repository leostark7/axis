"use client";

import { useEffect, useState } from "react";
import { Item, ItemType, TYPE_LABEL } from "@/lib/types";
import { useAxisStore } from "@/lib/store";
import { X, Trash2, CalendarPlus } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];

export default function ItemModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const updateItem = useAxisStore((s) => s.updateItem);
  const removeItem = useAxisStore((s) => s.removeItem);
  const scheduleItem = useAxisStore((s) => s.scheduleItem);

  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [type, setType] = useState<ItemType>(item.type);
  const [date, setDate] = useState(item.date ?? "");
  const [time, setTime] = useState(item.time ?? "");

  useEffect(() => {
    setTitle(item.title);
    setNotes(item.notes ?? "");
    setType(item.type);
    setDate(item.date ?? "");
    setTime(item.time ?? "");
  }, [item]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  async function handleSave() {
    await updateItem(item.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      date: date || null,
      time: time || null,
    });
    onClose();
  }

  async function handleDelete() {
    await removeItem(item.id);
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
          <span className="text-xs font-semibold uppercase tracking-wide text-[#101a2e]/40">
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
          placeholder="Notas (opcional)"
          rows={3}
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
