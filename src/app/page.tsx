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
import { ArrowRight, AlertTriangle, ClipboardList } from "lucide-react";

export default function HojePage() {
  const items = useAxisStore((s) => s.items);
  const scheduleItem = useAxisStore((s) => s.scheduleItem);
  const initDemandas = useDemandStore((s) => s.init);
  const demandas = useDemandStore((s) => s.demandas);

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
