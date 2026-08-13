"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAxisStore } from "@/lib/store";
import { classifyText } from "@/lib/classify";
import { ItemType, TYPE_LABEL } from "@/lib/types";
import { Sparkles, X, Loader2 } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];

export default function GlobalQuickAdd() {
  const pathname = usePathname();
  const addItem = useAxisStore((s) => s.addItem);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("idea");
  const [aiLoading, setAiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (pathname === "/login" || !open) {
    return pathname === "/login" ? null : (
      <button
        onClick={() => setOpen(true)}
        title="Captura rápida (Ctrl/Cmd+K)"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_10px_24px_-6px_rgba(37,99,235,0.6)] transition hover:scale-105"
      >
        <Sparkles size={22} />
      </button>
    );
  }

  function submit() {
    if (!title.trim()) return;
    addItem({ title, type, date: null });
    setTitle("");
    setOpen(false);
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
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#101a2e]/40 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-lg rounded-2xl p-2 shadow-2xl"
      >
        <div className="flex items-center gap-2 p-1">
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
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Captura rápida de qualquer lugar..."
            className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-[#101a2e] placeholder-[#101a2e]/35 outline-none"
          />
          <button
            onClick={submitWithAI}
            disabled={aiLoading}
            title="Deixar a IA classificar automaticamente"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] transition hover:brightness-110 disabled:opacity-60"
          >
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl p-2.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
