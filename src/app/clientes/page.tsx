"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClientStore } from "@/lib/clientStore";
import { useDemandStore } from "@/lib/demandStore";
import { CLIENT_STATUS_COLOR, CLIENT_STATUS_LABEL } from "@/lib/clientTypes";
import { exportToCsv } from "@/lib/csv";
import { syncKrast7Regimes } from "@/lib/krast7Sync";
import Krast7ImportModal from "@/components/Krast7ImportModal";
import { Plus, Building2, ChevronRight, Download, ArrowDownToLine, RefreshCw } from "lucide-react";

export default function ClientesPage() {
  const init = useClientStore((s) => s.init);
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
  const initDemandas = useDemandStore((s) => s.init);
  const demandas = useDemandStore((s) => s.demandas);
  const [name, setName] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const syncRan = useRef(false);

  useEffect(() => {
    init();
    initDemandas();
  }, [init, initDemandas]);

  useEffect(() => {
    if (syncRan.current || clients.length === 0) return;
    syncRan.current = true;
    syncKrast7Regimes(clients, updateClient).then((count) => {
      if (count > 0) setSyncedCount(count);
    });
  }, [clients, updateClient]);

  async function quickCreate() {
    if (!name.trim()) return;
    await addClient({ name });
    setName("");
  }

  function demandaCountFor(clientId: string) {
    return demandas.filter((d) => d.clientId === clientId && d.status !== "concluida").length;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold glow-text">🏢 Clientes</h1>
        <div className="flex items-center gap-2">
        <button
          data-tour="krast7-import"
          onClick={() => setShowImport(true)}
          title="Importar empresas já cadastradas no KRAST7"
          className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        >
          <ArrowDownToLine size={13} />
          Importar do KRAST7
        </button>
        <button
          data-tour="csv-export"
          onClick={() =>
            exportToCsv(
              "clientes.csv",
              clients.map((c) => ({
                nome: c.name,
                status: CLIENT_STATUS_LABEL[c.status],
                contato: c.contactName ?? "",
                email: c.contactEmail ?? "",
                telefone: c.contactPhone ?? "",
                demandas_pendentes: demandaCountFor(c.id),
              }))
            )
          }
          title="Exportar lista de clientes em CSV"
          className="flex items-center gap-1.5 rounded-xl border border-[#101a2e]/10 px-3 py-2 text-xs font-medium text-[#101a2e]/60 hover:bg-[#101a2e]/[0.06]"
        >
          <Download size={13} />
          Exportar CSV
        </button>
        </div>
      </div>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        Cada cliente reúne todos os roteiros e demandas relacionados num só lugar.
      </p>

      {syncedCount !== null && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700">
          <RefreshCw size={13} />
          {syncedCount} cliente{syncedCount > 1 ? "s" : ""} atualizado{syncedCount > 1 ? "s" : ""} automaticamente com o regime tributário mais recente do KRAST7.
        </div>
      )}

      <div className="glass mb-6 flex items-center gap-2 rounded-2xl p-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && quickCreate()}
          placeholder="Nome do novo cliente..."
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[#101a2e] placeholder-[#101a2e]/35 outline-none"
        />
        <button
          onClick={quickCreate}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] hover:brightness-110"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {clients.length === 0 && (
          <p className="glass rounded-2xl border-dashed p-8 text-center text-sm text-[#101a2e]/40">
            Nenhum cliente cadastrado ainda.
          </p>
        )}
        {clients.map((c) => {
          const pending = demandaCountFor(c.id);
          return (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="glass flex items-center gap-3 rounded-2xl p-4 shadow-sm transition hover:bg-[#101a2e]/[0.03]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Building2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#101a2e]">{c.name}</div>
                <div className="text-[11px] text-[#101a2e]/50">
                  {c.contactName || c.contactEmail || "Sem contato definido"}
                </div>
              </div>
              {pending > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {pending} pendente{pending > 1 ? "s" : ""}
                </span>
              )}
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CLIENT_STATUS_COLOR[c.status]}`}
              >
                {CLIENT_STATUS_LABEL[c.status]}
              </span>
              <ChevronRight size={16} className="shrink-0 text-[#101a2e]/30" />
            </Link>
          );
        })}
      </div>

      {showImport && <Krast7ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
