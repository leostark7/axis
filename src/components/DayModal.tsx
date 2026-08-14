"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Item } from "@/lib/types";
import { useAxisStore } from "@/lib/store";
import ItemChip from "./ItemChip";
import { X } from "lucide-react";

export default function DayModal({
  day,
  items,
  onClose,
}: {
  day: Date;
  items: Item[];
  onClose: () => void;
}) {
  const scheduleItem = useAxisStore((s) => s.scheduleItem);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#101a2e]/40 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[75vh] w-full flex-col rounded-t-3xl p-5 shadow-2xl md:max-w-md md:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold capitalize text-[#101a2e]">
            {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-[#101a2e]/35">Nada agendado pra esse dia.</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="text-sm">
              <ItemChip item={it} onUnschedule={() => scheduleItem(it.id, null)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
