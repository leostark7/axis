"use client";

import { usePathname } from "next/navigation";
import { useUndoStore } from "@/lib/undoStore";
import { Undo2 } from "lucide-react";

export default function UndoToast() {
  const pathname = usePathname();
  const message = useUndoStore((s) => s.message);
  const onUndo = useUndoStore((s) => s.onUndo);
  const clear = useUndoStore((s) => s.clear);

  if (pathname === "/login" || !onUndo) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#101a2e] px-4 py-3 text-white shadow-2xl md:bottom-6 md:left-auto md:right-96 md:translate-x-0">
      <span className="text-sm">{message}</span>
      <button
        onClick={() => {
          onUndo();
          clear();
        }}
        className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
      >
        <Undo2 size={13} />
        Desfazer
      </button>
    </div>
  );
}
