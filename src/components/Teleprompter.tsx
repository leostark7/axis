"use client";

import { useEffect, useRef, useState } from "react";
import { Item } from "@/lib/types";
import { X, Play, Pause, Minus, Plus } from "lucide-react";

export default function Teleprompter({ item, onClose }: { item: Item; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    function tick() {
      if (containerRef.current) {
        containerRef.current.scrollTop += speed * 0.6;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070d]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <span className="truncate text-sm font-medium text-white/70">{item.title}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeed((s) => Math.max(0.5, s - 0.5))}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center text-xs text-white/50">{speed}x</span>
          <button
            onClick={() => setSpeed((s) => Math.min(4, s + 0.5))}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="ml-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
            {playing ? "Pausar" : "Rodar"}
          </button>
          <button onClick={onClose} className="rounded-lg p-2 text-white/60 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto px-10 py-16 md:px-24">
        <p className="mx-auto max-w-3xl whitespace-pre-wrap text-center text-3xl leading-relaxed text-white md:text-4xl">
          {item.notes?.trim() || "Nenhuma anotação neste roteiro ainda. Adicione notas ao editar o item."}
        </p>
        <div className="h-[60vh]" />
      </div>
    </div>
  );
}
