"use client";

import { useEffect, useState } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAxisStore } from "@/lib/store";
import { useClientStore } from "@/lib/clientStore";
import {
  Item,
  SCRIPT_STAGE_LABEL,
  ScriptStage,
  STAGE_DEADLINE_DAYS,
  TYPE_GRADIENT,
} from "@/lib/types";
import QuickAdd from "@/components/QuickAdd";
import Teleprompter from "@/components/Teleprompter";
import RoteirosTimeline from "@/components/RoteirosTimeline";
import { Trash2, Presentation, Building2 } from "lucide-react";

const STAGES: ScriptStage[] = ["rascunho", "gravacao", "edicao", "publicacao"];
type ViewMode = "kanban" | "timeline";

function deadlineFor(item: Item) {
  const stage = item.scriptStage ?? "rascunho";
  return addDays(new Date(item.createdAt), STAGE_DEADLINE_DAYS[stage]);
}

export default function RoteirosPage() {
  const items = useAxisStore((s) => s.items);
  const setScriptStage = useAxisStore((s) => s.setScriptStage);
  const removeItem = useAxisStore((s) => s.removeItem);
  const [teleprompterItem, setTeleprompterItem] = useState<Item | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");
  const clients = useClientStore((s) => s.clients);
  const initClients = useClientStore((s) => s.init);

  useEffect(() => {
    initClients();
  }, [initClients]);

  function clientNameFor(id: string | null | undefined) {
    if (!id) return null;
    return clients.find((c) => c.id === id)?.name ?? null;
  }

  const scripts = items.filter((it) => it.type === "script");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold glow-text">🎬 Roteiros</h1>
        <div className="glass flex items-center gap-1 rounded-xl p-1">
          <button
            onClick={() => setView("kanban")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              view === "kanban"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "text-[#101a2e]/60 hover:bg-[#101a2e]/10"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("timeline")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              view === "timeline"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "text-[#101a2e]/60 hover:bg-[#101a2e]/10"
            }`}
          >
            Linha do tempo
          </button>
        </div>
      </div>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        Cada roteiro é um mini-projeto: do rascunho até a publicação, com prazo automático por etapa.
      </p>

      <div className="mb-6">
        <QuickAdd />
      </div>

      {view === "timeline" ? (
        <RoteirosTimeline scripts={scripts} />
      ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {STAGES.map((stage) => (
          <div key={stage} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              <span
                className={`h-2 w-2 rounded-full bg-gradient-to-br ${TYPE_GRADIENT.script}`}
              />
              {SCRIPT_STAGE_LABEL[stage]}
            </h2>
            <div className="glass flex min-h-[140px] flex-col gap-2 rounded-2xl p-2">
              {scripts
                .filter((s) => s.scriptStage === stage)
                .map((s) => {
                  const deadline = deadlineFor(s);
                  const daysLeft = differenceInCalendarDays(deadline, new Date());
                  const overdue = daysLeft < 0;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 shadow-sm"
                    >
                      <div className="mb-1.5 font-medium">{s.title}</div>
                      {clientNameFor(s.clientId) && (
                        <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700/80">
                          <Building2 size={10} />
                          {clientNameFor(s.clientId)}
                        </div>
                      )}
                      <div
                        className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          overdue
                            ? "bg-red-100 text-red-600"
                            : daysLeft <= 1
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {overdue
                          ? `Atrasado ${Math.abs(daysLeft)}d`
                          : daysLeft === 0
                            ? "Prazo hoje"
                            : `Prazo: ${format(deadline, "d MMM", { locale: ptBR })}`}
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          value={s.scriptStage}
                          onChange={(e) => setScriptStage(s.id, e.target.value as ScriptStage)}
                          className="rounded-lg bg-emerald-100 px-1.5 py-1 text-[11px] font-medium text-emerald-800 outline-none"
                        >
                          {STAGES.map((st) => (
                            <option key={st} value={st}>
                              {SCRIPT_STAGE_LABEL[st]}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTeleprompterItem(s)}
                            title="Abrir teleprompter"
                            className="text-emerald-700/60 hover:text-emerald-900"
                          >
                            <Presentation size={13} />
                          </button>
                          <button
                            onClick={() => removeItem(s.id)}
                            className="text-emerald-700/50 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      )}

      {teleprompterItem && (
        <Teleprompter item={teleprompterItem} onClose={() => setTeleprompterItem(null)} />
      )}
    </div>
  );
}
