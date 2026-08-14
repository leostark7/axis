"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAxisStore } from "@/lib/store";
import { useDemandStore } from "@/lib/demandStore";
import { Item, TYPE_LABEL } from "@/lib/types";
import { Demanda, DEMANDA_STATUS_LABEL } from "@/lib/demandTypes";
import ItemModal from "./ItemModal";
import DemandaModal from "./DemandaModal";
import { Search, X, Loader2 } from "lucide-react";

type Candidate = { id: string; kind: "item" | "demanda"; type: string; text: string };

export default function SemanticSearch() {
  const pathname = usePathname();
  const items = useAxisStore((s) => s.items);
  const demandas = useDemandStore((s) => s.demandas);
  const initDemandas = useDemandStore((s) => s.init);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Candidate[] | null>(null);
  const [openItem, setOpenItem] = useState<Item | null>(null);
  const [openDemanda, setOpenDemanda] = useState<Demanda | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initDemandas();
  }, [initDemandas]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
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
    else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  if (pathname === "/login") return null;

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    const candidates: Candidate[] = [
      ...items.map((it) => ({
        id: it.id,
        kind: "item" as const,
        type: TYPE_LABEL[it.type],
        text: `${it.title}${it.notes ? " — " + it.notes : ""}`,
      })),
      ...demandas.map((d) => ({
        id: d.id,
        kind: "demanda" as const,
        type: DEMANDA_STATUS_LABEL[d.status],
        text: `${d.title}${d.description ? " — " + d.description : ""}`,
      })),
    ];
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, candidates }),
      });
      const data = await res.json();
      const ids: string[] = data.ids ?? [];
      const matched = ids
        .map((id) => candidates.find((c) => c.id === id))
        .filter((c): c is Candidate => !!c);
      setResults(matched);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function openResult(c: Candidate) {
    if (c.kind === "item") {
      const item = items.find((it) => it.id === c.id);
      if (item) setOpenItem(item);
    } else {
      const demanda = demandas.find((d) => d.id === c.id);
      if (demanda) setOpenDemanda(demanda);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Busca inteligente (Ctrl/Cmd+/)"
        className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-[#101a2e]/60 transition hover:bg-[#101a2e]/[0.06] hover:text-[#101a2e]"
      >
        <Search size={16} />
        Buscar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#101a2e]/40 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-[#101a2e]/10 p-2">
              <Search size={16} className="ml-2 shrink-0 text-[#101a2e]/40" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder='Busque pelo sentido: "aquele contrato do cliente novo"...'
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-[#101a2e] placeholder-[#101a2e]/40 outline-none"
              />
              <button
                onClick={runSearch}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-[#101a2e]/50 hover:bg-[#101a2e]/10">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {results === null && !loading && (
                <p className="p-4 text-center text-xs text-[#101a2e]/40">
                  Pergunte com suas próprias palavras — não precisa ser o título exato.
                </p>
              )}
              {loading && (
                <p className="p-4 text-center text-xs text-[#101a2e]/40">Buscando...</p>
              )}
              {results?.length === 0 && (
                <p className="p-4 text-center text-xs text-[#101a2e]/40">Nada encontrado.</p>
              )}
              {results?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    openResult(c);
                    setOpen(false);
                  }}
                  className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left hover:bg-[#101a2e]/5"
                >
                  <span className="text-sm font-medium text-[#101a2e]">{c.text}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    {c.kind === "item" ? c.type : `Demanda · ${c.type}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {openItem && <ItemModal item={openItem} onClose={() => setOpenItem(null)} />}
      {openDemanda && <DemandaModal demanda={openDemanda} onClose={() => setOpenDemanda(null)} />}
    </>
  );
}
