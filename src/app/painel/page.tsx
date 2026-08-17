"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { useClientStore } from "@/lib/clientStore";
import { DEMANDA_STATUS_LABEL } from "@/lib/demandTypes";
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  Sparkles,
  Loader2,
  ArrowRight,
  Building2,
  Zap,
} from "lucide-react";

function KpiCard({
  label,
  value,
  sub,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  trend?: "up" | "down" | "flat";
  accent: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#101a2e]/45">{label}</span>
        {trend && trend !== "flat" && (
          <span className={trend === "up" ? "text-emerald-600" : "text-red-500"}>
            {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </span>
        )}
      </div>
      <div className={`mb-1 text-3xl font-extrabold ${accent}`}>{value}</div>
      <div className="text-[11px] text-[#101a2e]/45">{sub}</div>
    </div>
  );
}

export default function PainelPage() {
  const items = useAxisStore((s) => s.items);
  const demandas = useDemandStore((s) => s.demandas);
  const initDemandas = useDemandStore((s) => s.init);
  const clients = useClientStore((s) => s.clients);
  const initClients = useClientStore((s) => s.init);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    initDemandas();
    initClients();
  }, [initDemandas, initClients]);

  const now = new Date();

  const weekStats = useMemo(() => {
    const thisStart = startOfWeek(now, { weekStartsOn: 0 });
    const thisEnd = endOfWeek(now, { weekStartsOn: 0 });
    const lastStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    const lastEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });

    const doneThis =
      items.filter((it) => it.done && isWithinInterval(new Date(it.updatedAt ?? it.createdAt), { start: thisStart, end: thisEnd })).length +
      demandas.filter((d) => d.status === "concluida" && isWithinInterval(new Date(d.updatedAt), { start: thisStart, end: thisEnd })).length;

    const doneLast =
      items.filter((it) => it.done && isWithinInterval(new Date(it.updatedAt ?? it.createdAt), { start: lastStart, end: lastEnd })).length +
      demandas.filter((d) => d.status === "concluida" && isWithinInterval(new Date(d.updatedAt), { start: lastStart, end: lastEnd })).length;

    const pct = doneLast === 0 ? (doneThis > 0 ? 100 : 0) : Math.round(((doneThis - doneLast) / doneLast) * 100);
    return { doneThis, doneLast, pct, trend: doneThis > doneLast ? "up" : doneThis < doneLast ? "down" : "flat" } as const;
  }, [items, demandas]);

  const overdueItems = items.filter(
    (it) => it.date && !it.done && differenceInCalendarDays(now, new Date(it.date + "T00:00:00")) > 0
  );
  const overdueDemandas = demandas.filter(
    (d) => d.status !== "concluida" && d.dueDate && differenceInCalendarDays(now, new Date(d.dueDate + "T00:00:00")) >= 0
  );

  const bottleneckByClient = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of overdueDemandas) {
      if (!d.clientId) continue;
      counts.set(d.clientId, (counts.get(d.clientId) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0]
      ? { name: clients.find((c) => c.id === sorted[0][0])?.name ?? "Cliente", count: sorted[0][1] }
      : null;
  }, [overdueDemandas, clients]);

  const openDemandas = demandas.filter((d) => d.status !== "concluida").length;
  const last4Weeks = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const ref = subWeeks(now, 3 - i);
      const start = startOfWeek(ref, { weekStartsOn: 0 });
      const end = endOfWeek(ref, { weekStartsOn: 0 });
      const total =
        items.filter((it) => it.done && isWithinInterval(new Date(it.updatedAt ?? it.createdAt), { start, end })).length +
        demandas.filter((d) => d.status === "concluida" && isWithinInterval(new Date(d.updatedAt), { start, end })).length;
      return total;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, demandas]);

  const avgWeekly = last4Weeks.reduce((a, b) => a + b, 0) / 4;
  const forecastWeeks = avgWeekly > 0 ? Math.ceil(openDemandas / avgWeekly) : null;

  const clientHealth = clients.map((c) => {
    const pending = demandas.filter((d) => d.clientId === c.id && d.status !== "concluida").length;
    const overdue = demandas.filter(
      (d) => d.clientId === c.id && d.status !== "concluida" && d.dueDate && differenceInCalendarDays(now, new Date(d.dueDate + "T00:00:00")) >= 0
    ).length;
    return { ...c, pending, overdue };
  });

  async function generateInsight() {
    setLoadingInsight(true);
    setInsight(null);
    const stats = [
      `Concluídos essa semana: ${weekStats.doneThis} (semana passada: ${weekStats.doneLast})`,
      `Demandas em aberto no total: ${openDemandas}`,
      `Demandas atrasadas: ${overdueDemandas.length}`,
      `Itens atrasados: ${overdueItems.length}`,
      `Ritmo médio de conclusão nas últimas 4 semanas: ${avgWeekly.toFixed(1)} por semana`,
      bottleneckByClient ? `Cliente com mais atrasos: ${bottleneckByClient.name} (${bottleneckByClient.count})` : "",
    ]
      .filter(Boolean)
      .join("\n");

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
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">🧭 Painel Executivo</h1>
      <p className="mb-6 text-sm text-[#101a2e]/50">
        {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })} — o que importa saber em 10 segundos.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ritmo da semana"
          value={weekStats.doneThis}
          sub={`${weekStats.pct >= 0 ? "+" : ""}${weekStats.pct}% vs semana passada`}
          trend={weekStats.trend}
          accent="glow-text"
        />
        <KpiCard
          label="Demandas em aberto"
          value={openDemandas}
          sub={`${overdueDemandas.length} atrasadas`}
          accent={overdueDemandas.length > 0 ? "text-amber-600" : "text-emerald-600"}
        />
        <KpiCard
          label="Itens atrasados"
          value={overdueItems.length}
          sub="agendados no passado, não concluídos"
          accent={overdueItems.length > 0 ? "text-red-500" : "text-emerald-600"}
        />
        <KpiCard
          label="Previsão de fôlego"
          value={forecastWeeks ? `${forecastWeeks} sem.` : "—"}
          sub="pra zerar as demandas em aberto no ritmo atual"
          accent="text-blue-600"
        />
      </div>

      {bottleneckByClient && (
        <div className="glass mb-5 flex items-center gap-3 rounded-2xl border-amber-300/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertOctagon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#101a2e]">
              Maior gargalo: {bottleneckByClient.name}
            </div>
            <div className="text-xs text-[#101a2e]/50">
              {bottleneckByClient.count} demanda{bottleneckByClient.count > 1 ? "s" : ""} atrasada
              {bottleneckByClient.count > 1 ? "s" : ""} pra esse cliente — vale priorizar.
            </div>
          </div>
        </div>
      )}

      <div className="glass mb-6 rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
            <Zap size={13} />
            Ritmo — últimas 4 semanas
          </h2>
          <button
            onClick={generateInsight}
            disabled={loadingInsight}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {loadingInsight ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Análise por IA
          </button>
        </div>
        <div className="mb-3 flex h-24 items-end gap-3">
          {last4Weeks.map((v, i) => {
            const maxV = Math.max(1, ...last4Weeks);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-[#101a2e]/60">{v || ""}</span>
                <div
                  style={{ height: `${(v / maxV) * 100}%` }}
                  className="w-full min-h-[4px] rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                />
              </div>
            );
          })}
        </div>
        {insight && <p className="whitespace-pre-line border-t border-[#101a2e]/10 pt-3 text-sm text-[#101a2e]/75">{insight}</p>}
      </div>

      <div className="glass mb-6 rounded-2xl p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
          <Building2 size={13} />
          Saúde por cliente
        </h2>
        {clientHealth.length === 0 && <p className="text-xs text-[#101a2e]/35">Nenhum cliente cadastrado ainda.</p>}
        <div className="flex flex-col gap-1.5">
          {clientHealth
            .sort((a, b) => b.overdue - a.overdue || b.pending - a.pending)
            .map((c) => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-[#101a2e]/10 bg-white/40 px-3.5 py-2.5 text-xs hover:bg-[#101a2e]/[0.03]"
              >
                <span className="font-medium text-[#101a2e]">{c.name}</span>
                <span className="flex items-center gap-2">
                  {c.overdue > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-600">
                      {c.overdue} atrasada{c.overdue > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="rounded-full bg-[#101a2e]/5 px-2 py-0.5 font-medium text-[#101a2e]/60">
                    {c.pending} pendente{c.pending !== 1 ? "s" : ""}
                  </span>
                </span>
              </Link>
            ))}
        </div>
      </div>

      {overdueDemandas.length > 0 && (
        <div className="glass mb-6 rounded-2xl p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-red-600">
            Demandas atrasadas ({overdueDemandas.length})
          </h2>
          <div className="flex flex-col gap-1.5">
            {overdueDemandas.map((d) => (
              <Link
                key={d.id}
                href="/demandas"
                className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs"
              >
                <span className="font-medium text-[#101a2e]">{d.title}</span>
                <span className="font-semibold text-red-600">{DEMANDA_STATUS_LABEL[d.status]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/metricas"
        className="glass flex items-center justify-between rounded-2xl p-4 text-sm font-medium text-[#101a2e]/70 hover:bg-[#101a2e]/[0.03]"
      >
        Ver métricas detalhadas
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
