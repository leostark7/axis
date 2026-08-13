"use client";

import { useState } from "react";
import { Item, TYPE_COLOR_SOFT } from "@/lib/types";
import { useAxisStore } from "@/lib/store";
import { X, Check } from "lucide-react";
import ItemModal from "./ItemModal";

export default function ItemChip({ item, onUnschedule }: { item: Item; onUnschedule?: () => void }) {
  const toggleDone = useAxisStore((s) => s.toggleDone);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`group flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[11px] font-medium leading-tight shadow-sm ${TYPE_COLOR_SOFT[item.type]} ${
          item.done ? "opacity-40 line-through" : ""
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDone(item.id);
          }}
          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-current"
          title="Marcar como feito"
        >
          {item.done && <Check size={9} />}
        </button>
        <button onClick={() => setOpen(true)} className="min-w-0 flex-1 truncate text-left" title={item.title}>
          {item.time ? `${item.time} · ` : ""}
          {item.title}
        </button>
        {onUnschedule && (
          <button
            onClick={onUnschedule}
            className="hidden shrink-0 opacity-60 hover:opacity-100 group-hover:block"
            title="Voltar pra caixa de ideias"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && <ItemModal item={item} onClose={() => setOpen(false)} />}
    </>
  );
}
