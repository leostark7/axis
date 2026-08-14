"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClientStore } from "@/lib/clientStore";
import { useDemandStore } from "@/lib/demandStore";
import { CLIENT_STATUS_COLOR, CLIENT_STATUS_LABEL } from "@/lib/clientTypes";
import { Plus, Building2, ChevronRight } from "lucide-react";

export default function ClientesPage() {
  const init = useClientStore((s) => s.init);
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const initDemandas = useDemandStore((s) => s.init);
  const demandas = useDemandStore((s) => s.demandas);
  const [name, setName] = useState("");

  useEffect(() => {
    init();
    initDemandas();
  }, [init, initDemandas]);

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
      <h1 className="mb-1 text-2xl font-bold glow-text">🏢 Clientes</h1>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        Cada cliente reúne todos os roteiros e demandas relacionados num só lugar.
      </p>

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
    </div>
  );
}
