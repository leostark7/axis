"use client";

import { useMemo } from "react";
import { differenceInCalendarDays } from "date-fns";
import { useAxisStore } from "@/lib/store";
import { AlertTriangle } from "lucide-react";
import ItemChip from "./ItemChip";

const STALE_DAYS = 5;

export default function Radar() {
  const items = useAxisStore((s) => s.items);

  const stale = useMemo(() => {
    const now = new Date();
    return items.filter((it) => {
      if (it.done) return false;
      const age = differenceInCalendarDays(now, new Date(it.createdAt));
      if (!it.date) return age >= STALE_DAYS; // stuck in backlog
      if (it.type === "script" && (it.scriptStage ?? "rascunho") === "rascunho") {
        return age >= STALE_DAYS; // script never moved past draft
      }
      const overdue = differenceInCalendarDays(now, new Date(it.date + "T00:00:00"));
      return overdue > 0; // scheduled date already passed, not done
    });
  }, [items]);

  if (stale.length === 0) return null;

  return (
    <div className="glass mb-5 rounded-2xl border-amber-300/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700">
        <AlertTriangle size={16} />
        Radar de estagnação — {stale.length} {stale.length === 1 ? "item parado" : "itens parados"}
      </div>
      <div className="flex flex-wrap gap-2">
        {stale.map((it) => (
          <ItemChip key={it.id} item={it} />
        ))}
      </div>
    </div>
  );
}
