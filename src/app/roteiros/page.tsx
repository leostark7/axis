"use client";

import { useAxisStore } from "@/lib/store";
import { SCRIPT_STAGE_LABEL, ScriptStage, TYPE_GRADIENT } from "@/lib/types";
import QuickAdd from "@/components/QuickAdd";
import { Trash2 } from "lucide-react";

const STAGES: ScriptStage[] = ["rascunho", "gravacao", "edicao", "publicacao"];

export default function RoteirosPage() {
  const items = useAxisStore((s) => s.items);
  const setScriptStage = useAxisStore((s) => s.setScriptStage);
  const removeItem = useAxisStore((s) => s.removeItem);

  const scripts = items.filter((it) => it.type === "script");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">🎬 Roteiros</h1>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        Cada roteiro é um mini-projeto: do rascunho até a publicação.
      </p>

      <div className="mb-6">
        <QuickAdd />
      </div>

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
                .map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 shadow-sm"
                  >
                    <div className="mb-2 font-medium">{s.title}</div>
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
                      <button
                        onClick={() => removeItem(s.id)}
                        className="text-emerald-700/50 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
