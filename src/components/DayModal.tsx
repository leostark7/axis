"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Item, ItemType, TYPE_LABEL } from "@/lib/types";
import { useAxisStore } from "@/lib/store";
import ItemChip from "./ItemChip";
import { X, Plus } from "lucide-react";

const TYPES: ItemType[] = ["idea", "task", "script", "event"];

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
  const addItem = useAxisStore((s) => s.addItem);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("task");
  const [time, setTime] = useState("");

  function submit() {
    if (!title.trim()) return;
    addItem({ title, type, date: format(day, "yyyy-MM-dd"), time: time || null });
    setTitle("");
    setTime("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#101a2e]/40 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[85vh] w-full flex-col rounded-t-3xl p-5 shadow-2xl md:max-w-md md:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold capitalize text-[#101a2e]">
            {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10">
            <X size={18} />
          </button>
        </div>
        <div className="mb-3 flex flex-col gap-2 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-[#101a2e]/55">Nada agendado pra esse dia ainda.</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="text-sm">
              <ItemChip item={it} onUnschedule={() => scheduleItem(it.id, null)} />
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-[#101a2e]/10 pt-3">
          <div className="mb-2 flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="rounded-xl bg-[#101a2e]/5 px-2.5 py-2 text-xs font-medium text-[#101a2e] outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl bg-[#101a2e]/5 px-2.5 py-2 text-xs text-[#101a2e] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={`Adicionar pra ${format(day, "d MMM", { locale: ptBR })}...`}
              className="min-w-0 flex-1 rounded-xl bg-[#101a2e]/5 px-3 py-2.5 text-sm text-[#101a2e] outline-none placeholder-[#101a2e]/35"
            />
            <button
              onClick={submit}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
