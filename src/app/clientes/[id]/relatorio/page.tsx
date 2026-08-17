"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientStore } from "@/lib/clientStore";
import { useDemandStore } from "@/lib/demandStore";
import { useAxisStore } from "@/lib/store";
import { useDocumentStore } from "@/lib/documentStore";
import { CLIENT_STATUS_LABEL } from "@/lib/clientTypes";
import { DEMANDA_STATUS_LABEL } from "@/lib/demandTypes";
import { TYPE_LABEL } from "@/lib/types";
import { ArrowLeft, Printer, Zap } from "lucide-react";

export default function ClienteRelatorioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const initClients = useClientStore((s) => s.init);
  const clients = useClientStore((s) => s.clients);
  const initDemandas = useDemandStore((s) => s.init);
  const demandas = useDemandStore((s) => s.demandas);
  const initItems = useAxisStore((s) => s.init);
  const items = useAxisStore((s) => s.items);
  const initDocs = useDocumentStore((s) => s.init);
  const documents = useDocumentStore((s) => s.documents);

  useEffect(() => {
    initClients();
    initDemandas();
    initItems();
    initDocs();
  }, [initClients, initDemandas, initItems, initDocs]);

  const client = clients.find((c) => c.id === params.id);
  const clientDemandas = demandas.filter((d) => d.clientId === params.id);
  const clientItems = items.filter((it) => it.clientId === params.id);
  const clientDocs = documents.filter((d) => d.clientId === params.id);

  const concluidas = clientDemandas.filter((d) => d.status === "concluida");
  const emAndamento = clientDemandas.filter((d) => d.status !== "concluida");

  if (!client) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-[#101a2e]/40">Cliente não encontrado (ou ainda carregando).</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 print:p-0">
      <div className="no-print mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push(`/clientes/${client.id}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#101a2e]/50 hover:text-[#101a2e]"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)]"
        >
          <Printer size={14} />
          Imprimir / Salvar PDF
        </button>
      </div>

      <div className="glass print-clean rounded-2xl p-8">
        <div className="mb-8 flex items-center justify-between border-b border-[#101a2e]/10 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold glow-text">Axis</div>
              <div className="text-[10px] uppercase tracking-widest text-[#101a2e]/50">LS Brainstorm</div>
            </div>
          </div>
          <div className="text-right text-xs text-[#101a2e]/45">
            Relatório gerado em {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>

        <h1 className="mb-1 text-2xl font-bold text-[#101a2e]">{client.name}</h1>
        <p className="mb-6 text-sm text-[#101a2e]/50">
          Status: {CLIENT_STATUS_LABEL[client.status]}
          {client.contactName ? ` · Contato: ${client.contactName}` : ""}
        </p>

        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 p-4 text-center">
            <div className="text-2xl font-extrabold text-emerald-600">{concluidas.length}</div>
            <div className="text-[11px] text-emerald-700/70">demandas concluídas</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 text-center">
            <div className="text-2xl font-extrabold text-blue-600">{emAndamento.length}</div>
            <div className="text-[11px] text-blue-700/70">em andamento</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 text-center">
            <div className="text-2xl font-extrabold text-amber-600">{clientDocs.length}</div>
            <div className="text-[11px] text-amber-700/70">documentos entregues</div>
          </div>
        </div>

        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
          O que já entregamos
        </h2>
        <div className="mb-6 flex flex-col gap-1.5">
          {concluidas.length === 0 && <p className="text-xs text-[#101a2e]/35">Nada concluído ainda.</p>}
          {concluidas.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg bg-[#101a2e]/[0.03] px-3 py-2 text-xs">
              <span className="font-medium text-[#101a2e]">{d.title}</span>
              <span className="text-[#101a2e]/40">{format(new Date(d.updatedAt), "d MMM yyyy", { locale: ptBR })}</span>
            </div>
          ))}
        </div>

        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
          Em andamento
        </h2>
        <div className="mb-6 flex flex-col gap-1.5">
          {emAndamento.length === 0 && <p className="text-xs text-[#101a2e]/35">Nada em andamento no momento.</p>}
          {emAndamento.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg bg-[#101a2e]/[0.03] px-3 py-2 text-xs">
              <span className="font-medium text-[#101a2e]">{d.title}</span>
              <span className="text-[#101a2e]/40">
                {DEMANDA_STATUS_LABEL[d.status]}
                {d.dueDate ? ` · prazo ${format(new Date(d.dueDate + "T00:00:00"), "d MMM", { locale: ptBR })}` : ""}
              </span>
            </div>
          ))}
        </div>

        {clientItems.length > 0 && (
          <>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              Roteiros e conteúdos
            </h2>
            <div className="mb-6 flex flex-col gap-1.5">
              {clientItems.map((it) => (
                <div key={it.id} className="flex items-center justify-between rounded-lg bg-[#101a2e]/[0.03] px-3 py-2 text-xs">
                  <span className="font-medium text-[#101a2e]">{it.title}</span>
                  <span className="text-[#101a2e]/40">{TYPE_LABEL[it.type]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mt-8 border-t border-[#101a2e]/10 pt-4 text-center text-[10px] text-[#101a2e]/35">
          Relatório interno gerado pelo Axis — LS Brainstorm
        </p>
      </div>
    </div>
  );
}
