"use client";

import { useState } from "react";
import { useAxisStore } from "@/lib/store";
import { Item, ItemType, TYPE_COLOR, TYPE_LABEL } from "@/lib/types";
import QuickAdd from "@/components/QuickAdd";
import { Trash2, CalendarPlus } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];

export default function BacklogPage() {
  const items = useAxisStore((s) => s.items);
  const removeItem = useAxisStore((s) => s.removeItem);
  const scheduleItem = useAxisStore((s) => s.scheduleItem);
  const [filter, setFilter] = useState<ItemType | "all">("all");

  const backlog = items
    .filter((it) => !it.date)
    .filter((it) => filter === "all" || it.type === filter);

  function scheduleToday(it: Item) {
    const today = new Date().toISOString().slice(0, 10);
    scheduleItem(it.id, today);
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

      <div className="mb-5 flex gap-2">
        {(["all", ...TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              filter === t
                ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_4px_12px_-4px_rgba(37, 99, 235,0.5)]"
                : "border-[#101a2e]/15 text-[#101a2e]/60 hover:bg-[#101a2e]/5"
            }`}
          >
            {t === "all" ? "Tudo" : TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {backlog.length === 0 && (
          <p className="glass rounded-2xl border-dashed p-8 text-center text-sm text-[#101a2e]/55">
            Nada aqui. Sua caixa de ideias está vazia.
          </p>
        )}
        {backlog.map((it) => (
          <div
            key={it.id}
            className="glass flex items-center gap-3 rounded-2xl p-3.5 shadow-sm"
          >
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
