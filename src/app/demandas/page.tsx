"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDemandStore } from "@/lib/demandStore";
import { useAxisStore } from "@/lib/store";
import { useClientStore } from "@/lib/clientStore";
import { Demanda, DEMANDA_STATUS_COLOR, DEMANDA_STATUS_LABEL, DemandaStatus } from "@/lib/demandTypes";
import DemandaModal from "@/components/DemandaModal";
import DemandaGantt from "@/components/DemandaGantt";
import { exportToCsv } from "@/lib/csv";
import { Plus, Paperclip, Link2, Building2, AlertTriangle, Calendar as CalendarIcon, Clock, Download, GanttChartSquare, LayoutGrid } from "lucide-react";

function isOverdue(dueDate: string | null, endTime: string | null, status: DemandaStatus) {
  if (!dueDate || status === "concluida") return false;
  const deadline = new Date(`${dueDate}T${endTime ?? "23:59"}:00`);
  return new Date() > deadline;
}

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
  const clients = useClientStore((s) => s.clients);
  const initClients = useClientStore((s) => s.init);
  const [open, setOpen] = useState<Demanda | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [view, setView] = useState<"kanban" | "gantt">("kanban");

  useEffect(() => {
    init();
    initItems();
    initClients();
  }, [init, initItems, initClients]);

  function emailFor(id: string | null) {
    if (!id) return null;
    return profiles.find((p) => p.id === id)?.email.split("@")[0] ?? null;
  }

  function itemTitleFor(id: string | null) {
    if (!id) return null;
    return items.find((it) => it.id === id)?.title ?? null;
  }

  function clientNameFor(id: string | null) {
    if (!id) return null;
    return clients.find((c) => c.id === id)?.name ?? null;
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
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold glow-text">📋 Demandas</h1>
        <div className="flex items-center gap-2">
          <div data-tour="gantt-toggle" className="glass flex items-center gap-1 rounded-xl p-1">
            <button
              onClick={() => setView("kanban")}
              title="Ver como quadro"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                view === "kanban" ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-[#101a2e]/50"
              }`}
            >
              <LayoutGrid size={12} />
              Quadro
            </button>
            <button
              onClick={() => setView("gantt")}
              title="Ver linha do tempo (Gantt) por cliente"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                view === "gantt" ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-[#101a2e]/50"
              }`}
            >
              <GanttChartSquare size={12} />
              Linha do tempo
            </button>
          </div>
          <button
            onClick={() =>
              exportToCsv(
                "demandas.csv",
                demandas.map((d) => ({
                  titulo: d.title,
                  status: DEMANDA_STATUS_LABEL[d.status],
                  cliente: clientNameFor(d.clientId) ?? "",
                  responsavel: emailFor(d.assignedTo) ?? "",
                  prazo: d.dueDate ?? "",
                  criada_em: d.createdAt,
                }))
              )
            }
            title="Exportar demandas em CSV"
            className="flex items-center gap-1.5 rounded-xl border border-[#101a2e]/10 px-3 py-2 text-xs font-medium text-[#101a2e]/60 hover:bg-[#101a2e]/[0.06]"
          >
            <Download size={13} />
            CSV
          </button>
        </div>
      </div>
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

      {view === "gantt" ? (
        <DemandaGantt demandas={demandas} clients={clients} onOpen={setOpen} />
      ) : (
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
                  const late = isOverdue(d.dueDate, d.endTime, d.status);
                  return (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                    onClick={() => setOpen(d)}
                    className={`cursor-grab rounded-xl border p-3 text-left text-xs shadow-sm active:cursor-grabbing ${
                      late ? "border-red-400 bg-red-50 ring-1 ring-red-300" : DEMANDA_STATUS_COLOR[d.status]
                    }`}
                  >
                    {late && (
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-red-600">
                        <AlertTriangle size={11} />
                        Atrasada{overdue > 0 ? ` há ${overdue} ${overdue === 1 ? "dia" : "dias"}` : ""}
                      </div>
                    )}
                    {!late && status !== "concluida" && (
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <Clock size={11} />
                        Pendente
                      </div>
                    )}
                    <div className="mb-1.5 font-semibold">{d.title}</div>
                    {clientNameFor(d.clientId) && (
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                        <Building2 size={10} />
                        {clientNameFor(d.clientId)}
                      </div>
                    )}
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
                      {(d.startTime || d.endTime) && (
                        <span className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 font-medium">
                          <Clock size={10} />
                          {d.startTime ?? "?"}–{d.endTime ?? "?"}
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
      )}

      {open && <DemandaModal demanda={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
