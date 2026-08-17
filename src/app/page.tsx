"use client";

import { useEffect } from "react";
import Link from "next/link";
import { differenceInCalendarDays, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAxisStore } from "@/lib/store";
import { useDemandStore } from "@/lib/demandStore";
import ItemChip from "@/components/ItemChip";
import QuickAdd from "@/components/QuickAdd";
import SummaryPanel from "@/components/SummaryPanel";
import Radar from "@/components/Radar";
import { DEMANDA_STATUS_COLOR, DEMANDA_STATUS_LABEL } from "@/lib/demandTypes";
import { useChatUiStore } from "@/lib/chatUiStore";
import { ArrowRight, AlertTriangle, ClipboardList, Mic, LayoutDashboard, Tv } from "lucide-react";

export default function HojePage() {
  const items = useAxisStore((s) => s.items);
  const scheduleItem = useAxisStore((s) => s.scheduleItem);
  const initDemandas = useDemandStore((s) => s.init);
  const demandas = useDemandStore((s) => s.demandas);
  const openWithVoice = useChatUiStore((s) => s.openWithVoice);

  useEffect(() => {
    initDemandas();
  }, [initDemandas]);

  const now = new Date();
  const todayItems = items
    .filter((it) => it.date && isToday(new Date(it.date + "T00:00:00")))
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));

  const overdueItems = items.filter(
    (it) => it.date && !it.done && differenceInCalendarDays(now, new Date(it.date + "T00:00:00")) > 0
  );

  const urgentDemandas = demandas.filter((d) => {
    if (d.status === "concluida" || !d.dueDate) return false;
    const overdue = differenceInCalendarDays(now, new Date(d.dueDate + "T00:00:00"));
    return overdue >= 0;
  });

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-1 text-2xl font-bold capitalize glow-text">
        {greeting} — {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </h1>
      <p className="mb-5 text-sm text-[#101a2e]/50">Um resumo do que importa agora.</p>

      <button
        data-tour="quick-voice"
        onClick={openWithVoice}
        title="Fala o que precisa e a IA organiza pra você"
        className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_10px_24px_-6px_rgba(37,99,235,0.5)] transition hover:brightness-110 active:scale-[0.99]"
      >
        <Mic size={18} />
        Toque para falar
      </button>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Link
          data-tour="painel-link"
          href="/painel"
          title="Visão executiva de 10 segundos do seu negócio"
          className="glass flex items-center gap-2 rounded-2xl p-3.5 text-xs font-semibold text-[#101a2e]/75 hover:bg-[#101a2e]/[0.04]"
        >
          <LayoutDashboard size={16} className="text-blue-600" />
          Painel Executivo
        </Link>
        <Link
          data-tour="apresentacao-link"
          href="/apresentacao"
          title="Abre um mural pra deixar numa TV ou monitor da sala"
          className="glass flex items-center gap-2 rounded-2xl p-3.5 text-xs font-semibold text-[#101a2e]/75 hover:bg-[#101a2e]/[0.04]"
        >
          <Tv size={16} className="text-cyan-600" />
          Modo Apresentação
        </Link>
      </div>

      <div className="mb-5">
        <QuickAdd />
      </div>

      <Radar />

      {urgentDemandas.length > 0 && (
        <div className="glass mb-5 rounded-2xl p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-600">
            <AlertTriangle size={15} />
            Demandas urgentes ({urgentDemandas.length})
          </h2>
          <div className="flex flex-col gap-2">
            {urgentDemandas.map((d) => (
              <Link
                key={d.id}
                href="/demandas"
                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs shadow-sm ${DEMANDA_STATUS_COLOR[d.status]}`}
              >
                <span className="font-medium">{d.title}</span>
                <span className="text-[10px] font-semibold opacity-70">{DEMANDA_STATUS_LABEL[d.status]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="glass mb-5 rounded-2xl p-4">
        <h2 className="mb-2 text-sm font-bold text-[#101a2e]/80">📅 Compromissos de hoje</h2>
        {todayItems.length === 0 ? (
          <p className="text-xs text-[#101a2e]/35">Nada agendado pra hoje. Aproveita pra planejar.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {todayItems.map((it) => (
              <ItemChip key={it.id} item={it} onUnschedule={() => scheduleItem(it.id, null)} />
            ))}
          </div>
        )}
      </div>

      {overdueItems.length > 0 && (
        <div className="glass mb-5 rounded-2xl border-amber-300/50 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700">
            <ClipboardList size={15} />
            Atrasados ({overdueItems.length})
          </h2>
          <div className="flex flex-col gap-1.5">
            {overdueItems.map((it) => (
              <ItemChip key={it.id} item={it} onUnschedule={() => scheduleItem(it.id, null)} />
            ))}
          </div>
        </div>
      )}

      <SummaryPanel />

      <Link
        href="/calendario"
        className="glass mb-2 flex items-center justify-between rounded-2xl p-4 text-sm font-medium text-[#101a2e]/70 hover:bg-[#101a2e]/[0.03]"
      >
        Ver calendário completo
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
