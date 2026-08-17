"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientStore } from "@/lib/clientStore";
import { useDemandStore } from "@/lib/demandStore";
import { useAxisStore } from "@/lib/store";
import { CLIENT_STATUS_COLOR, CLIENT_STATUS_LABEL, ClientStatus } from "@/lib/clientTypes";
import { DEMANDA_STATUS_COLOR, DEMANDA_STATUS_LABEL } from "@/lib/demandTypes";
import { TYPE_LABEL } from "@/lib/types";
import DemandaModal from "@/components/DemandaModal";
import ItemModal from "@/components/ItemModal";
import { ArrowLeft, Trash2, FileText } from "lucide-react";

const STATUSES: ClientStatus[] = ["ativo", "pausado", "encerrado"];

export default function ClienteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const initClients = useClientStore((s) => s.init);
  const clients = useClientStore((s) => s.clients);
  const updateClient = useClientStore((s) => s.updateClient);
  const removeClient = useClientStore((s) => s.removeClient);
  const initDemandas = useDemandStore((s) => s.init);
  const demandas = useDemandStore((s) => s.demandas);
  const initItems = useAxisStore((s) => s.init);
  const items = useAxisStore((s) => s.items);
  const [openDemandaId, setOpenDemandaId] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  useEffect(() => {
    initClients();
    initDemandas();
    initItems();
  }, [initClients, initDemandas, initItems]);

  const client = clients.find((c) => c.id === params.id);
  const clientDemandas = demandas.filter((d) => d.clientId === params.id);
  const clientItems = items.filter((it) => it.clientId === params.id);
  const openDemanda = clientDemandas.find((d) => d.id === openDemandaId) ?? null;
  const openItem = clientItems.find((it) => it.id === openItemId) ?? null;

  if (!client) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-[#101a2e]/40">Cliente não encontrado (ou ainda carregando).</p>
      </div>
    );
  }

  const clientId = client.id;
  async function handleDelete() {
    await removeClient(clientId);
    router.push("/clientes");
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/clientes")}
          className="flex items-center gap-1.5 text-xs font-medium text-[#101a2e]/50 hover:text-[#101a2e]"
        >
          <ArrowLeft size={14} />
          Todos os clientes
        </button>
        <button
          data-tour="relatorio-button"
          onClick={() => router.push(`/clientes/${clientId}/relatorio`)}
          title="Gerar relatório compartilhável desse cliente (PDF)"
          className="flex items-center gap-1.5 rounded-xl border border-[#101a2e]/10 px-3 py-2 text-xs font-medium text-[#101a2e]/60 hover:bg-[#101a2e]/[0.06]"
        >
          <FileText size={13} />
          Gerar relatório
        </button>
      </div>

      <div className="glass mb-6 rounded-2xl p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <input
            defaultValue={client.name}
            onBlur={(e) => updateClient(client.id, { name: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-xl font-bold text-[#101a2e] outline-none"
          />
          <select
            value={client.status}
            onChange={(e) => updateClient(client.id, { status: e.target.value as ClientStatus })}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold outline-none ${CLIENT_STATUS_COLOR[client.status]}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {CLIENT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            defaultValue={client.contactName ?? ""}
            onBlur={(e) => updateClient(client.id, { contactName: e.target.value })}
            placeholder="Nome do contato"
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
          />
          <input
            defaultValue={client.contactEmail ?? ""}
            onBlur={(e) => updateClient(client.id, { contactEmail: e.target.value })}
            placeholder="E-mail"
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
          />
          <input
            defaultValue={client.contactPhone ?? ""}
            onBlur={(e) => updateClient(client.id, { contactPhone: e.target.value })}
            placeholder="Telefone"
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
          />
        </div>
        <textarea
          defaultValue={client.notes ?? ""}
          onBlur={(e) => updateClient(client.id, { notes: e.target.value })}
          placeholder="Anotações sobre o cliente..."
          rows={2}
          className="mt-2 w-full resize-none rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2 text-xs text-[#101a2e] outline-none"
        />
      </div>

      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
        Demandas ({clientDemandas.length})
      </h2>
      <div className="mb-6 flex flex-col gap-2">
        {clientDemandas.length === 0 && (
          <p className="text-xs text-[#101a2e]/35">Nenhuma demanda vinculada a esse cliente.</p>
        )}
        {clientDemandas.map((d) => (
          <button
            key={d.id}
            onClick={() => setOpenDemandaId(d.id)}
            className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs shadow-sm ${DEMANDA_STATUS_COLOR[d.status]}`}
          >
            <span className="font-medium">{d.title}</span>
            <span className="text-[10px] font-semibold opacity-70">{DEMANDA_STATUS_LABEL[d.status]}</span>
          </button>
        ))}
      </div>

      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
        Roteiros e itens ({clientItems.length})
      </h2>
      <div className="mb-6 flex flex-col gap-2">
        {clientItems.length === 0 && (
          <p className="text-xs text-[#101a2e]/35">Nenhum item vinculado a esse cliente.</p>
        )}
        {clientItems.map((it) => (
          <button
            key={it.id}
            onClick={() => setOpenItemId(it.id)}
            className="flex items-center justify-between rounded-xl border border-[#101a2e]/10 bg-white/50 p-3 text-left text-xs shadow-sm"
          >
            <span className="font-medium text-[#101a2e]">{it.title}</span>
            <span className="text-[10px] font-semibold text-[#101a2e]/50">
              {TYPE_LABEL[it.type]} {it.date && `· ${format(new Date(it.date + "T00:00:00"), "d MMM", { locale: ptBR })}`}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleDelete}
        className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
      >
        <Trash2 size={13} />
        Excluir cliente
      </button>

      {openDemanda && <DemandaModal demanda={openDemanda} onClose={() => setOpenDemandaId(null)} />}
      {openItem && <ItemModal item={openItem} onClose={() => setOpenItemId(null)} />}
    </div>
  );
}
