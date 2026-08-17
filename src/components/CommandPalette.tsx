"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  CalendarDays,
  Inbox,
  Clapperboard,
  ClipboardList,
  Building2,
  MessageSquare,
  FolderOpen,
  BarChart3,
  History,
  LayoutDashboard,
  Tv,
  Mic,
  Moon,
  SunMedium,
  Plus,
  Search,
} from "lucide-react";
import { useCommandPaletteStore } from "@/lib/commandPaletteStore";
import { useChatUiStore } from "@/lib/chatUiStore";
import { useThemeStore } from "@/lib/themeStore";

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Sun;
  run: () => void;
};

export default function CommandPalette() {
  const isOpen = useCommandPaletteStore((s) => s.isOpen);
  const open = useCommandPaletteStore((s) => s.open);
  const close = useCommandPaletteStore((s) => s.close);
  const openWithVoice = useChatUiStore((s) => s.openWithVoice);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const commands: Command[] = useMemo(
    () => [
      { id: "hoje", label: "Ir para Hoje", icon: Sun, run: () => router.push("/") },
      { id: "painel", label: "Ir para Painel Executivo", icon: LayoutDashboard, run: () => router.push("/painel") },
      { id: "calendario", label: "Ir para Calendário", icon: CalendarDays, run: () => router.push("/calendario") },
      { id: "mensagens", label: "Ir para Mensagens", icon: MessageSquare, run: () => router.push("/mensagens") },
      { id: "backlog", label: "Ir para Caixa de Ideias", icon: Inbox, run: () => router.push("/backlog") },
      { id: "roteiros", label: "Ir para Roteiros", icon: Clapperboard, run: () => router.push("/roteiros") },
      { id: "demandas", label: "Ir para Demandas", icon: ClipboardList, run: () => router.push("/demandas") },
      { id: "documentos", label: "Ir para Documentos", icon: FolderOpen, run: () => router.push("/documentos") },
      { id: "clientes", label: "Ir para Clientes", icon: Building2, run: () => router.push("/clientes") },
      { id: "metricas", label: "Ir para Métricas", icon: BarChart3, run: () => router.push("/metricas") },
      { id: "atividade", label: "Ir para Atividade", icon: History, run: () => router.push("/atividade") },
      { id: "apresentacao", label: "Abrir Modo Apresentação", icon: Tv, run: () => router.push("/apresentacao") },
      {
        id: "voz",
        label: "Adicionar por voz",
        hint: "abre o assistente pra ouvir você",
        icon: Mic,
        run: () => openWithVoice(),
      },
      {
        id: "tema",
        label: "Alternar tema claro/escuro",
        icon: Moon,
        run: () => toggleTheme(),
      },
      {
        id: "novo-demanda",
        label: "Nova demanda",
        icon: Plus,
        run: () => router.push("/demandas"),
      },
    ],
    [router, openWithVoice, toggleTheme]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  function runAndClose(cmd: Command) {
    cmd.run();
    close();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[#101a2e]/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-[#101a2e]/10 px-4 py-3">
          <Search size={16} className="shrink-0 text-[#101a2e]/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              }
              if (e.key === "Enter" && filtered[highlight]) {
                runAndClose(filtered[highlight]);
              }
            }}
            placeholder="Para onde ir? O que fazer?"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#101a2e] placeholder-[#101a2e]/35 outline-none"
          />
          <kbd className="shrink-0 rounded-md border border-[#101a2e]/15 bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold text-[#101a2e]/50">
            Esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="p-4 text-center text-xs text-[#101a2e]/40">Nada encontrado.</p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => runAndClose(cmd)}
              onMouseEnter={() => setHighlight(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                i === highlight ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-[#101a2e]/75"
              }`}
            >
              <cmd.icon size={15} />
              <span className="flex-1">{cmd.label}</span>
              {cmd.hint && <span className={`text-[10px] ${i === highlight ? "text-white/70" : "text-[#101a2e]/40"}`}>{cmd.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
