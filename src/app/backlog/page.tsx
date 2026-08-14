"use client";

import { useState } from "react";
import { useAxisStore } from "@/lib/store";
import { Item, ItemType, TYPE_COLOR, TYPE_LABEL } from "@/lib/types";
import QuickAdd from "@/components/QuickAdd";
import { Trash2, CalendarPlus, CheckSquare, Square, X } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];

export default function BacklogPage() {
  const items = useAxisStore((s) => s.items);
  const removeItem = useAxisStore((s) => s.removeItem);
  const scheduleItem = useAxisStore((s) => s.scheduleItem);
  const bulkSchedule = useAxisStore((s) => s.bulkSchedule);
  const bulkRemove = useAxisStore((s) => s.bulkRemove);
  const [filter, setFilter] = useState<ItemType | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const backlog = items
    .filter((it) => !it.date)
    .filter((it) => filter === "all" || it.type === filter);

  function scheduleToday(it: Item) {
    const today = new Date().toISOString().slice(0, 10);
    scheduleItem(it.id, today);
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkScheduleToday() {
    const today = new Date().toISOString().slice(0, 10);
    await bulkSchedule(Array.from(selected), today);
    setSelected(new Set());
  }

  async function bulkDelete() {
    await bulkRemove(Array.from(selected));
    setSelected(new Set());
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">✨ Caixa de Ideias</h1>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        Tudo que ainda não tem data. Capture aqui, decida "quando" depois.
      </p>

      <div className="mb-5">
        <QuickAdd />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(["all", ...TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                filter === t
                  ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]"
                  : "border-[#101a2e]/15 text-[#101a2e]/60 hover:bg-[#101a2e]/5"
              }`}
            >
              {t === "all" ? "Tudo" : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        {backlog.length > 0 && (
          <button
            onClick={() =>
              setSelected((s) => (s.size === backlog.length ? new Set() : new Set(backlog.map((i) => i.id))))
            }
            className="flex items-center gap-1.5 text-xs font-medium text-[#101a2e]/50 hover:text-[#101a2e]"
          >
            {selected.size === backlog.length ? <CheckSquare size={14} /> : <Square size={14} />}
            Selecionar tudo
          </button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="glass mb-4 flex items-center justify-between rounded-2xl px-4 py-2.5">
          <span className="text-xs font-semibold text-[#101a2e]/70">
            {selected.size} selecionado{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkScheduleToday}
              className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
            >
              <CalendarPlus size={13} />
              Agendar hoje
            </button>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200"
            >
              <Trash2 size={13} />
              Excluir
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {backlog.length === 0 && (
          <p className="glass rounded-2xl border-dashed p-8 text-center text-sm text-[#101a2e]/55">
            Nada aqui. Sua caixa de ideias está vazia.
          </p>
        )}
        {backlog.map((it) => (
          <div
            key={it.id}
            className={`glass flex items-center gap-3 rounded-2xl p-3.5 shadow-sm ${
              selected.has(it.id) ? "ring-2 ring-blue-400" : ""
            }`}
          >
            <button
              onClick={() => toggleSelect(it.id)}
              className="shrink-0 text-[#101a2e]/40 hover:text-blue-600"
            >
              {selected.has(it.id) ? (
                <CheckSquare size={18} className="text-blue-600" />
              ) : (
                <Square size={18} />
              )}
            </button>
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TYPE_COLOR[it.type]}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[#101a2e]">{it.title}</div>
              <div className="text-[11px] text-[#101a2e]/60">{TYPE_LABEL[it.type]}</div>
            </div>
            <button
              onClick={() => scheduleToday(it)}
              title="Agendar para hoje"
              className="rounded-lg border border-[#101a2e]/10 p-2 text-[#101a2e]/50 hover:bg-[#101a2e]/5 hover:text-[#101a2e]"
            >
              <CalendarPlus size={14} />
            </button>
            <button
              onClick={() => removeItem(it.id)}
              title="Excluir"
              className="rounded-lg border border-[#101a2e]/10 p-2 text-[#101a2e]/50 hover:bg-red-100 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
