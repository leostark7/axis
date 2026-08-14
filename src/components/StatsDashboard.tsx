"use client";

import { useMemo } from "react";
import { useAxisStore } from "@/lib/store";
import { Item, TYPE_LABEL, ItemType } from "@/lib/types";

function Ring({
  value,
  total,
  label,
  sublabel,
  colorFrom,
  colorTo,
}: {
  value: number;
  total: number;
  label: string;
  sublabel: string;
  colorFrom: string;
  colorTo: string;
}) {
  const size = 64;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? value / total : 0;
  const offset = circumference * (1 - pct);
  const gradId = `ring-${label.replace(/\s/g, "")}`;

  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
      <div className="relative h-16 w-16 shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(16,26,46,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#101a2e]">
          {value}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-[#101a2e]">{label}</div>
        <div className="text-[11px] text-[#101a2e]/45">{sublabel}</div>
      </div>
    </div>
  );
}

const TYPE_DOT: Record<ItemType, string> = {
  idea: "bg-amber-400",
  task: "bg-sky-500",
  event: "bg-blue-600",
  script: "bg-emerald-500",
};

export default function StatsDashboard() {
  const items = useAxisStore((s) => s.items);

  const stats = useMemo(() => {
    const scheduled = items.filter((it: Item) => it.date);
    const done = scheduled.filter((it) => it.done).length;
    const pending = scheduled.length - done;
    const backlog = items.filter((it) => !it.date).length;

    const byType: Record<ItemType, number> = { idea: 0, task: 0, event: 0, script: 0 };
    for (const it of items) byType[it.type]++;

    return { scheduled: scheduled.length, done, pending, backlog, byType };
  }, [items]);

  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <Ring
        value={stats.done}
        total={stats.scheduled}
        label="Concluído"
        sublabel={`${stats.done} de ${stats.scheduled} agendados`}
        colorFrom="#10b981"
        colorTo="#0891b2"
      />
      <Ring
        value={stats.pending}
        total={stats.scheduled}
        label="Em andamento"
        sublabel="agendados, ainda não feitos"
        colorFrom="#2563eb"
        colorTo="#0ea5e9"
      />
      <Ring
        value={stats.backlog}
        total={items.length}
        label="Falta agendar"
        sublabel="na caixa de ideias"
        colorFrom="#f59e0b"
        colorTo="#f97316"
      />

      <div className="glass flex items-center gap-4 rounded-2xl px-4 py-3">
        {(Object.keys(TYPE_LABEL) as ItemType[]).map((t) => (
          <div key={t} className="flex flex-col items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[t]}`} />
            <span className="text-sm font-bold text-[#101a2e]">{stats.byType[t]}</span>
            <span className="text-[10px] text-[#101a2e]/60">{TYPE_LABEL[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
