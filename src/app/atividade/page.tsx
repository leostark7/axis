"use client";

import { useEffect, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useActivityStore } from "@/lib/activityStore";
import { useDemandStore } from "@/lib/demandStore";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, CalendarDays, Users } from "lucide-react";

export default function AtividadePage() {
  const init = useActivityStore((s) => s.init);
  const entries = useActivityStore((s) => s.entries);
  const profiles = useDemandStore((s) => s.profiles);
  const initProfiles = useDemandStore((s) => s.init);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    init();
    initProfiles();
    createClient()
      .auth.getUser()
      .then(({ data }) => setMyId(data.user?.id ?? null));
  }, [init, initProfiles]);

  function nameFor(actorId: string | null) {
    if (!actorId) return "Alguém";
    if (actorId === myId) return "Você";
    return profiles.find((p) => p.id === actorId)?.email.split("@")[0] ?? "Alguém";
  }

  function dayLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "d 'de' MMMM", { locale: ptBR });
  }

  const grouped: Record<string, typeof entries> = {};
  for (const e of entries) {
    const key = dayLabel(e.createdAt);
    (grouped[key] ??= []).push(e);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">🕘 Atividade</h1>
      <p className="mb-6 text-sm text-[#101a2e]/50">
        Histórico do que aconteceu no Axis — quem fez o quê e quando.
      </p>

      {entries.length === 0 && (
        <p className="glass rounded-2xl p-8 text-center text-sm text-[#101a2e]/40">
          Nenhuma atividade registrada ainda.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([day, dayEntries]) => (
          <div key={day}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/40">{day}</h2>
            <div className="glass flex flex-col divide-y divide-[#101a2e]/5 rounded-2xl">
              {dayEntries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    {e.entityType === "demanda" ? (
                      <ClipboardList size={14} />
                    ) : e.entityType === "cliente" ? (
                      <Users size={14} />
                    ) : (
                      <CalendarDays size={14} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[#101a2e]">
                      <span className="font-semibold">{nameFor(e.actorId)}</span> {e.verb}{" "}
                      <span className="font-medium">"{e.entityTitle}"</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#101a2e]/35">
                    {format(new Date(e.createdAt), "HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
