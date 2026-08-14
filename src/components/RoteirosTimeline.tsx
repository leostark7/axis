"use client";

import { Item, SCRIPT_STAGE_LABEL, ScriptStage, STAGE_DEADLINE_DAYS } from "@/lib/types";

const STAGES: ScriptStage[] = ["rascunho", "gravacao", "edicao", "publicacao"];
const STAGE_BAR_COLOR: Record<ScriptStage, string> = {
  rascunho: "bg-amber-400",
  gravacao: "bg-sky-500",
  edicao: "bg-indigo-500",
  publicacao: "bg-emerald-500",
};

export default function RoteirosTimeline({ scripts }: { scripts: Item[] }) {
  if (scripts.length === 0) {
    return (
      <p className="glass rounded-2xl border-dashed p-8 text-center text-sm text-[#101a2e]/55">
        Nenhum roteiro pra mostrar na linha do tempo.
      </p>
    );
  }

  const totalDays = STAGE_DEADLINE_DAYS.publicacao;

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex justify-between pl-40 text-[10px] text-[#101a2e]/60">
        {Array.from({ length: totalDays + 1 }, (_, i) => i)
          .filter((i) => i % 2 === 0)
          .map((i) => (
            <span key={i}>D{i}</span>
          ))}
      </div>
      {scripts.map((s) => {
        const currentStage = s.scriptStage ?? "rascunho";
        const currentStageIndex = STAGES.indexOf(currentStage);
        return (
          <div key={s.id} className="flex items-center gap-2">
            <span className="w-40 shrink-0 truncate text-xs font-medium text-[#101a2e]/70" title={s.title}>
              {s.title}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-[#101a2e]/5">
              {STAGES.map((stage, i) => {
                const start = i === 0 ? 0 : STAGE_DEADLINE_DAYS[STAGES[i - 1]];
                const end = STAGE_DEADLINE_DAYS[stage];
                const widthPct = ((end - start) / totalDays) * 100;
                const leftPct = (start / totalDays) * 100;
                const reached = i <= currentStageIndex;
                return (
                  <div
                    key={stage}
                    title={`${SCRIPT_STAGE_LABEL[stage]}: até D${end}`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute top-0 h-full ${
                      reached ? STAGE_BAR_COLOR[stage] : "bg-[#101a2e]/10"
                    } ${i === 0 ? "rounded-l-full" : ""} ${i === STAGES.length - 1 ? "rounded-r-full" : ""}`}
                  />
                );
              })}
            </div>
            <span className="w-20 shrink-0 text-right text-[10px] font-semibold text-[#101a2e]/50">
              {SCRIPT_STAGE_LABEL[currentStage]}
            </span>
          </div>
        );
      })}
      <p className="pl-40 text-[10px] text-[#101a2e]/50">
        Barra colorida = etapas já alcançadas. Cinza = etapas futuras, com prazo estimado a partir da criação.
      </p>
    </div>
  );
}
