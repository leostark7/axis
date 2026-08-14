"use client";

import { useState } from "react";
import { differenceInCalendarDays, format, isToday } from "date-fns";
import { useAxisStore } from "@/lib/store";
import { TYPE_LABEL } from "@/lib/types";
import { Sparkles, Loader2 } from "lucide-react";

function buildContext(items: ReturnType<typeof useAxisStore.getState>["items"], kind: "day" | "week") {
  const now = new Date();
  const lines: string[] = [];

  const todays = items.filter((it) => it.date && isToday(new Date(it.date + "T00:00:00")));
  const overdue = items.filter(
    (it) => it.date && !it.done && differenceInCalendarDays(now, new Date(it.date + "T00:00:00")) > 0
  );
  const backlog = items.filter((it) => !it.date);
  const stale = items.filter((it) => {
    if (it.done) return false;
    const age = differenceInCalendarDays(now, new Date(it.createdAt));
    return age >= 5 && (!it.date || (it.type === "script" && it.scriptStage === "rascunho"));
  });

  lines.push(`Hoje é ${format(now, "dd/MM/yyyy")}.`);
  lines.push(
    `Itens de hoje (${todays.length}): ` +
      (todays.map((i) => `${TYPE_LABEL[i.type]} "${i.title}"${i.time ? ` às ${i.time}` : ""}`).join("; ") || "nenhum")
  );
  lines.push(
    `Atrasados (${overdue.length}): ` + (overdue.map((i) => `"${i.title}"`).join("; ") || "nenhum")
  );
  lines.push(
    `Parados/estagnados (${stale.length}): ` + (stale.map((i) => `"${i.title}"`).join("; ") || "nenhum")
  );
  if (kind === "week") {
    lines.push(`Total na caixa de ideias sem data: ${backlog.length}`);
    const doneRecently = items.filter(
      (it) => it.done && differenceInCalendarDays(now, new Date(it.createdAt)) <= 7
    ).length;
    lines.push(`Concluídos recentemente: ${doneRecently}`);
  }
  return lines.join("\n");
}

export default function SummaryPanel() {
  const items = useAxisStore((s) => s.items);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState<"day" | "week" | null>(null);

  async function generate(kind: "day" | "week") {
    setLoading(kind);
    setText(null);
    try {
      const context = buildContext(items, kind);
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, kind }),
      });
      const data = await res.json();
      setText(data.text ?? "Não foi possível gerar o resumo.");
    } catch {
      setText("Não foi possível gerar o resumo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass mb-5 rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#101a2e]/80">✨ Resumo inteligente</h2>
        <div className="flex gap-2">
          <button
            onClick={() => generate("day")}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {loading === "day" ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Resumo do dia
          </button>
          <button
            onClick={() => generate("week")}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-lg border border-[#101a2e]/15 px-3 py-1.5 text-xs font-semibold text-[#101a2e]/70 hover:bg-[#101a2e]/5 disabled:opacity-60"
          >
            {loading === "week" ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Resumo da semana
          </button>
        </div>
      </div>
      {text ? (
        <p className="whitespace-pre-line text-sm text-[#101a2e]/75">{text}</p>
      ) : (
        <p className="text-xs text-[#101a2e]/55">
          Clique num dos botões pra IA analisar sua agenda e te dar um panorama rápido.
        </p>
      )}
    </div>
  );
}
