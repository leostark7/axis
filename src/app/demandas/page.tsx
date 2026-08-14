"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDemandStore } from "@/lib/demandStore";
import { useAxisStore } from "@/lib/store";
import { Demanda, DEMANDA_STATUS_COLOR, DEMANDA_STATUS_LABEL, DemandaStatus } from "@/lib/demandTypes";
import DemandaModal from "@/components/DemandaModal";
import { Plus, Paperclip, Link2, AlertTriangle, Calendar as CalendarIcon } from "lucide-react";

function overdueDays(dueDate: string | null, status: DemandaStatus) {
  if (!dueDate || status === "concluida") return 0;
  return differenceInCalendarDays(new Date(), new Date(dueDate + "T00:00:00"));
}

const STATUSES: DemandaStatus[] = ["aberta", "andamento", "concluida"];

export default function DemandasPage() {
  const init = useDemandStore((s) => s.init);
  const demandas = useDemandStore((s) => s.demandas);
  const profiles = useDemandStore((s) => s.profiles);
  const addDemanda = useDemandStore((s) => s.addDemanda);
  const updateDemanda = useDemandStore((s) => s.updateDemanda);
  const items = useAxisStore((s) => s.items);
  const initItems = useAxisStore((s) => s.init);
  const [open, setOpen] = useState<Demanda | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    init();
    initItems();
  }, [init, initItems]);

  function emailFor(id: string | null) {
    if (!id) return null;
    return profiles.find((p) => p.id === id)?.email.split("@")[0] ?? null;
  }

  function itemTitleFor(id: string | null) {
    if (!id) return null;
    return items.find((it) => it.id === id)?.title ?? null;
  }

  async function quickCreate() {
    if (!newTitle.trim()) return;
    await addDemanda({ title: newTitle });
    setNewTitle("");
  }

  function handleDrop(e: React.DragEvent, status: DemandaStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) updateDemanda(id, { status });
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">📋 Demandas</h1>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        O lugar pra pedir e acompanhar demandas entre vocês — anexe documentos, atribua e comente, sem
        precisar do WhatsApp.
      </p>

      <div className="glass mb-6 flex items-center gap-2 rounded-2xl p-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && quickCreate()}
          placeholder="Nova demanda... (ex: enviar contrato assinado do cliente X)"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[#101a2e] placeholder-[#101a2e]/35 outline-none"
        />
        <button
          onClick={quickCreate}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] hover:brightness-110"
        >
          <Plus size={16} />
          Criar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATUSES.map((status) => (
          <div key={status} className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              {DEMANDA_STATUS_LABEL[status]} (
              {demandas.filter((d) => d.status === status).length})
            </h2>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
              className="glass flex min-h-[160px] flex-col gap-2 rounded-2xl p-2 transition-colors"
            >
              {demandas
                .filter((d) => d.status === status)
                .map((d) => {
                  const overdue = overdueDays(d.dueDate, d.status);
                  return (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                    onClick={() => setOpen(d)}
                    className={`cursor-grab rounded-xl border p-3 text-left text-xs shadow-sm active:cursor-grabbing ${
                      overdue > 0 ? "border-red-400 bg-red-50 ring-1 ring-red-300" : DEMANDA_STATUS_COLOR[d.status]
                    }`}
                  >
                    {overdue > 0 && (
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-red-600">
                        <AlertTriangle size={11} />
                        Atrasada há {overdue} {overdue === 1 ? "dia" : "dias"}
                      </div>
                    )}
                    <div className="mb-1.5 font-semibold">{d.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] opacity-80">
                      {emailFor(d.assignedTo) && (
                        <span className="rounded-full bg-white/60 px-2 py-0.5 font-medium">
                          👤 {emailFor(d.assignedTo)}
                        </span>
                      )}
                      {d.dueDate && (
                        <span className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 font-medium">
                          <CalendarIcon size={10} />
                          {format(new Date(d.dueDate + "T00:00:00"), "d MMM", { locale: ptBR })}
                        </span>
                      )}
                      {d.attachments.length > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 font-medium">
                          <Paperclip size={10} />
                          {d.attachments.length}
                        </span>
                      )}
                      {itemTitleFor(d.linkedItemId) && (
                        <span
                          className="flex max-w-[140px] items-center gap-1 truncate rounded-full bg-white/60 px-2 py-0.5 font-medium"
                          title={itemTitleFor(d.linkedItemId) ?? undefined}
                        >
                          <Link2 size={10} />
                          {itemTitleFor(d.linkedItemId)}
                        </span>
                      )}
                      {(d.reactions ?? []).length > 0 && (
                        <span className="rounded-full bg-white/60 px-2 py-0.5 font-medium">
                          {Array.from(new Set((d.reactions ?? []).map((r) => r.emoji))).join(" ")}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {open && <DemandaModal demanda={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
