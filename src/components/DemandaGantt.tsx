"use client";

import { useMemo } from "react";
import { addDays, differenceInCalendarDays, format, max as dateMax, min as dateMin } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Demanda } from "@/lib/demandTypes";
import { Client } from "@/lib/clientTypes";
import { Building2 } from "lucide-react";

const BAR_COLOR: Record<Demanda["status"], string> = {
  aberta: "from-amber-400 to-orange-400",
  andamento: "from-blue-500 to-cyan-400",
  concluida: "from-emerald-400 to-teal-400",
};

export default function DemandaGantt({
  demandas,
  clients,
  onOpen,
}: {
  demandas: Demanda[];
  clients: Client[];
  onOpen: (d: Demanda) => void;
}) {
  const { rangeStart, rangeEnd, days, grouped } = useMemo(() => {
    const withDates = demandas.map((d) => ({
      d,
      start: new Date(d.createdAt),
      end: d.dueDate ? new Date(d.dueDate + "T00:00:00") : addDays(new Date(d.createdAt), 3),
    }));
    const today = new Date();
    const starts = withDates.length ? withDates.map((x) => x.start) : [today];
    const ends = withDates.length ? withDates.map((x) => x.end) : [addDays(today, 14)];
    const rangeStart = dateMin([...starts, addDays(today, -3)]);
    const rangeEnd = dateMax([...ends, addDays(today, 10)]);
    const totalDays = Math.max(7, differenceInCalendarDays(rangeEnd, rangeStart) + 1);

    const byClient = new Map<string, { name: string; items: typeof withDates }>();
    for (const entry of withDates) {
      const key = entry.d.clientId ?? "sem-cliente";
      const name = clients.find((c) => c.id === entry.d.clientId)?.name ?? "Sem cliente vinculado";
      if (!byClient.has(key)) byClient.set(key, { name, items: [] });
      byClient.get(key)!.items.push(entry);
    }

    return { rangeStart, rangeEnd, days: totalDays, grouped: Array.from(byClient.values()) };
  }, [demandas, clients]);

  const todayOffset = differenceInCalendarDays(new Date(), rangeStart);

  if (demandas.length === 0) {
    return (
      <div className="glass rounded-2xl border-dashed p-8 text-center text-sm text-[#101a2e]/40">
        Nenhuma demanda ainda pra mostrar na linha do tempo.
      </div>
    );
  }

  return (
    <div className="glass overflow-x-auto rounded-2xl p-4">
      <div style={{ minWidth: days * 26 + 200 }}>
        <div className="mb-2 flex text-[10px] font-semibold text-[#101a2e]/40" style={{ paddingLeft: 200 }}>
          {Array.from({ length: days }, (_, i) => addDays(rangeStart, i)).map((d, i) => (
            <div key={i} style={{ width: 26 }} className="shrink-0 text-center">
              {d.getDate() === 1 || i === 0 ? format(d, "d MMM", { locale: ptBR }) : d.getDate()}
            </div>
          ))}
        </div>

        {grouped.map((group) => (
          <div key={group.name} className="mb-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#101a2e]/70" style={{ paddingLeft: 4 }}>
              <Building2 size={11} />
              {group.name}
            </div>
            {group.items.map(({ d, start, end }) => {
              const offset = Math.max(0, differenceInCalendarDays(start, rangeStart));
              const span = Math.max(1, differenceInCalendarDays(end, start) + 1);
              return (
                <div key={d.id} className="mb-1 flex items-center" style={{ height: 28 }}>
                  <div className="w-[200px] shrink-0 truncate pr-2 text-xs text-[#101a2e]/70" title={d.title}>
                    {d.title}
                  </div>
                  <div className="relative flex-1" style={{ height: 22 }}>
                    <button
                      onClick={() => onOpen(d)}
                      title={`${d.title} — ${d.dueDate ? `prazo ${format(end, "d MMM", { locale: ptBR })}` : "sem prazo definido"}`}
                      style={{ marginLeft: offset * 26, width: span * 26 - 3 }}
                      className={`h-[22px] rounded-lg bg-gradient-to-r ${BAR_COLOR[d.status]} text-left text-[10px] font-semibold text-white shadow-sm hover:brightness-110`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="relative -mt-1">
          <div
            className="absolute top-[-6px] bottom-0 w-px bg-red-500"
            style={{ left: 200 + todayOffset * 26 + 13 }}
            title="Hoje"
          />
        </div>
      </div>
    </div>
  );
}
