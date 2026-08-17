"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay, isToday, isWithinInterval, startOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAxisStore } from "@/lib/store";
import { useDemandStore } from "@/lib/demandStore";
import { X } from "lucide-react";

const SECTIONS = ["agenda", "urgente", "ritmo"] as const;
type Section = (typeof SECTIONS)[number];

export default function ApresentacaoPage() {
  const router = useRouter();
  const items = useAxisStore((s) => s.items);
  const demandas = useDemandStore((s) => s.demandas);
  const initDemandas = useDemandStore((s) => s.init);
  const [now, setNow] = useState(new Date());
  const [sectionIdx, setSectionIdx] = useState(0);

  useEffect(() => {
    initDemandas();
  }, [initDemandas]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSectionIdx((i) => (i + 1) % SECTIONS.length), 9000);
    return () => clearInterval(t);
  }, []);

  const section: Section = SECTIONS[sectionIdx];

  const todayItems = items
    .filter((it) => it.date && isToday(new Date(it.date + "T00:00:00")))
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));

  const urgentDemandas = demandas.filter((d) => d.status !== "concluida");

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 60; i++) {
      const day = subDays(now, i);
      const doneOnDay =
        items.some((it) => it.done && it.updatedAt && isSameDay(new Date(it.updatedAt), day)) ||
        demandas.some((d) => d.status === "concluida" && isSameDay(new Date(d.updatedAt), day));
      if (doneOnDay) count++;
      else if (i > 0) break;
    }
    return count;
  }, [items, demandas, now]);

  const monthProgress = useMemo(() => {
    const start = startOfMonth(now);
    const scheduled = items.filter((it) => it.date && isWithinInterval(new Date(it.date + "T00:00:00"), { start, end: now }));
    const done = scheduled.filter((it) => it.done).length;
    const pct = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
    return { done, total: scheduled.length, pct };
  }, [items, now]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#050c1c] via-[#0b1636] to-[#031321] p-10 text-white">
      <button
        onClick={() => router.push("/")}
        className="absolute right-6 top-6 rounded-full bg-white/10 p-2.5 text-white/70 hover:bg-white/20"
      >
        <X size={20} />
      </button>

      <div className="mb-2 text-7xl font-black tracking-tight">{format(now, "HH:mm")}</div>
      <div className="mb-10 text-lg capitalize text-white/60">{format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>

      <div className="flex w-full max-w-3xl flex-1 items-center justify-center">
        {section === "agenda" && (
          <div className="w-full">
            <h2 className="mb-6 text-center text-2xl font-bold text-cyan-300">📅 Agenda de hoje</h2>
            {todayItems.length === 0 ? (
              <p className="text-center text-white/40">Nada agendado pra hoje.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {todayItems.slice(0, 6).map((it) => (
                  <div key={it.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-6 py-4">
                    <span className="text-lg font-medium">{it.title}</span>
                    <span className="text-lg font-bold text-cyan-300">{it.time ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "urgente" && (
          <div className="w-full">
            <h2 className="mb-6 text-center text-2xl font-bold text-amber-300">⚡ Demandas em aberto</h2>
            {urgentDemandas.length === 0 ? (
              <p className="text-center text-white/40">Tudo em dia — nenhuma demanda em aberto 🎉</p>
            ) : (
              <div className="flex flex-col gap-3">
                {urgentDemandas.slice(0, 6).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-6 py-4">
                    <span className="text-lg font-medium">{d.title}</span>
                    <span className="text-sm font-bold text-amber-300">
                      {d.dueDate ? format(new Date(d.dueDate + "T00:00:00"), "d MMM", { locale: ptBR }) : "sem prazo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "ritmo" && (
          <div className="flex w-full flex-col items-center gap-8">
            <h2 className="text-2xl font-bold text-emerald-300">🔥 Ritmo da equipe</h2>
            <div className="flex gap-10">
              <div className="text-center">
                <div className="text-6xl font-black text-emerald-300">{streak}</div>
                <div className="mt-1 text-sm text-white/50">dias seguidos com entregas</div>
              </div>
              <div className="text-center">
                <div className="text-6xl font-black text-cyan-300">{monthProgress.pct}%</div>
                <div className="mt-1 text-sm text-white/50">
                  do mês concluído ({monthProgress.done}/{monthProgress.total})
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-2">
        {SECTIONS.map((s, i) => (
          <span key={s} className={`h-1.5 w-8 rounded-full transition ${i === sectionIdx ? "bg-cyan-400" : "bg-white/15"}`} />
        ))}
      </div>
    </div>
  );
}
