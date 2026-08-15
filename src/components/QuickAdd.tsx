"use client";

import { useEffect, useState } from "react";
import { useAxisStore } from "@/lib/store";
import { useClientStore } from "@/lib/clientStore";
import { classifyText } from "@/lib/classify";
import { ItemType, TYPE_LABEL } from "@/lib/types";
import VoiceButton from "./VoiceButton";
import { Sparkles, Loader2 } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];

export default function QuickAdd() {
  const addItem = useAxisStore((s) => s.addItem);
  const clients = useClientStore((s) => s.clients);
  const initClients = useClientStore((s) => s.init);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("idea");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    initClients();
  }, [initClients]);

  function submit() {
    if (!title.trim()) return;
    addItem({ title, type, date: null });
    setTitle("");
  }

  async function submitWithAI(overrideText?: string) {
    const text = overrideText ?? title;
    if (!text.trim()) return;
    setAiLoading(true);
    const result = await classifyText(text, clients.map((c) => c.name));
    setAiLoading(false);
    if (result) {
      const matchedClient = clients.find(
        (c) => c.name.toLowerCase() === result.clientName?.toLowerCase()
      );
      addItem({
        title: `${result.emoji} ${result.title}`,
        type: result.type,
        date: result.date,
        time: result.time,
        clientId: matchedClient?.id ?? null,
      });
    } else {
      addItem({ title: text, type, date: null });
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
      <VoiceButton onResult={(text) => submitWithAI(text)} />
      <button
        onClick={() => submitWithAI()}
        disabled={aiLoading}
        title="Deixar a IA classificar tipo, data, hora e cliente automaticamente"
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] transition hover:brightness-110 disabled:opacity-60"
      >
        {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        Capturar
      </button>
    </div>
  );
}
