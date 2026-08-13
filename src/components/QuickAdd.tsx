"use client";

import { useState } from "react";
import { useAxisStore } from "@/lib/store";
import { classifyText } from "@/lib/classify";
import { ItemType, TYPE_LABEL } from "@/lib/types";
import { Sparkles, Loader2 } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];

export default function QuickAdd() {
  const addItem = useAxisStore((s) => s.addItem);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("idea");
  const [aiLoading, setAiLoading] = useState(false);

  function submit() {
    if (!title.trim()) return;
    addItem({ title, type, date: null });
    setTitle("");
  }

  async function submitWithAI() {
    if (!title.trim()) return;
    setAiLoading(true);
    const result = await classifyText(title);
    setAiLoading(false);
    if (result) {
      addItem({ title: result.title, type: result.type, date: result.date, time: result.time });
    } else {
      addItem({ title, type, date: null });
    }
    setTitle("");
  }

  return (
    <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-sm">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ItemType)}
        className="rounded-xl bg-[#101a2e]/5 px-3 py-2.5 text-sm font-medium text-[#101a2e] outline-none"
      >
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABEL[t]}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Jogue aqui uma ideia, tarefa ou roteiro..."
        className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-[#101a2e] placeholder-[#101a2e]/35 outline-none"
      />
      <button
        onClick={submitWithAI}
        disabled={aiLoading}
        title="Deixar a IA classificar tipo, data e hora automaticamente"
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] transition hover:brightness-110 disabled:opacity-60"
      >
        {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        Capturar
      </button>
    </div>
  );
}
