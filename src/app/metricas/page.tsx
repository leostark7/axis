"use client";

import { useEffect, useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  isWithinInterval,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAxisStore } from "@/lib/store";
import { useDemandStore } from "@/lib/demandStore";
import { TYPE_LABEL, ItemType } from "@/lib/types";
import { Sparkles, Loader2 } from "lucide-react";

const WEEKS_BACK = 8;
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function MetricasPage() {
  const items = useAxisStore((s) => s.items);
  const demandas = useDemandStore((s) => s.demandas);
  const initDemandas = useDemandStore((s) => s.init);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    initDemandas();
  }, [initDemandas]);

  const weeks = useMemo(() => {
    const now = new Date();
    return Array.from({ length: WEEKS_BACK }, (_, i) => {
      const ref = subWeeks(now, WEEKS_BACK - 1 - i);
      const start = startOfWeek(ref, { weekStartsOn: 0 });
      const end = endOfWeek(ref, { weekStartsOn: 0 });
      const itemsDone = items.filter(
        (it) => it.done && isWithinInterval(new Date(it.updatedAt ?? it.createdAt), { start, end })
      ).length;
      const demandasDone = demandas.filter(
        (d) => d.status === "concluida" && isWithinInterval(new Date(d.updatedAt), { start, end })
      ).length;
      return { start, end, itemsDone, demandasDone, total: itemsDone + demandasDone };
    });
  }, [items, demandas]);

  const max = Math.max(1, ...weeks.map((w) => w.total));

  const byType = useMemo(() => {
    const counts: Record<ItemType, number> = { idea: 0, task: 0, event: 0, script: 0 };
    for (const it of items) counts[it.type]++;
    return counts;
  }, [items]);

  const totalConcluded = items.filter((i) => i.done).length + demandas.filter((d) => d.status === "concluida").length;

  async function generateInsight() {
    setLoadingInsight(true);
    setInsight(null);
    const now = new Date();
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    for (const it of items) {
      if (it.date) weekdayCounts[new Date(it.date + "T00:00:00").getDay()]++;
    }
    const overdueItems = items.filter(
      (it) => it.date && !it.done && differenceInCalendarDays(now, new Date(it.date + "T00:00:00")) > 0
    );
    const backlogByType: Record<ItemType, number> = { idea: 0, task: 0, event: 0, script: 0 };
    for (const it of items) if (!it.date) backlogByType[it.type]++;

    const stats = [
      `Itens por dia da semana: ${WEEKDAY_LABELS.map((d, i) => `${d}=${weekdayCounts[i]}`).join(", ")}`,
      `Itens atrasados (agendados no passado, não concluídos): ${overdueItems.length}`,
      `Itens sem data (backlog) por tipo: ${Object.entries(backlogByType)
        .map(([t, c]) => `${TYPE_LABEL[t as ItemType]}=${c}`)
        .join(", ")}`,
      `Concluídos nas últimas ${WEEKS_BACK} semanas: ${weeks.map((w) => w.total).join(", ")}`,
      `Demandas atrasadas: ${
        demandas.filter(
          (d) => d.status !== "concluida" && d.dueDate && differenceInCalendarDays(now, new Date(d.dueDate + "T00:00:00")) > 0
        ).length
      }`,
    ].join("\n");

    try {
      const res = await fetch("/api/agenda-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });
      const data = await res.json();
      setInsight(data.text ?? "Não foi possível gerar a análise.");
    } catch {
      setInsight("Não foi possível gerar a análise.");
    } finally {
      setLoadingInsight(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">📊 Métricas</h1>
      <p className="mb-6 text-sm text-[#101a2e]/50">
        Ritmo real de conclusão ao longo do tempo — {totalConcluded} itens concluídos no total.
      </p>

      <div className="glass mb-6 rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
            🔍 Análise de Agenda
          </h2>
          <button
            onClick={generateInsight}
            disabled={loadingInsight}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {loadingInsight ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Analisar padrões
          </button>
        </div>
        {insight ? (
          <p className="whitespace-pre-line text-sm text-[#101a2e]/75">{insight}</p>
        ) : (
          <p className="text-xs text-[#101a2e]/40">
            Clique pra IA identificar padrões de comportamento — em que dias você mais agenda, o que
            costuma atrasar, e uma sugestão prática baseada nos seus dados.
          </p>
        )}
      </div>

      <div className="glass mb-6 rounded-2xl p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
          Concluídos por semana (últimas {WEEKS_BACK})
        </h2>
        <div className="flex h-40 items-end gap-2">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#101a2e]/60">{w.total || ""}</span>
              <div
                style={{ height: `${(w.total / max) * 100}%` }}
                className="w-full min-h-[4px] rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                title={`${w.total} concluídos`}
              />
              <span className="text-[9px] text-[#101a2e]/55">{format(w.start, "d/M", { locale: ptBR })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
          Distribuição por tipo (todos os itens)
        </h2>
        <div className="flex flex-col gap-2">
          {(Object.keys(byType) as ItemType[]).map((t) => {
            const total = Object.values(byType).reduce((a, b) => a + b, 0) || 1;
            const pct = (byType[t] / total) * 100;
            return (
              <div key={t} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-[#101a2e]/60">{TYPE_LABEL[t]}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#101a2e]/5">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-bold text-[#101a2e]/70">
                  {byType[t]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
