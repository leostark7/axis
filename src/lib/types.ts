export type ItemType = "idea" | "task" | "event" | "script";

export type ScriptStage = "rascunho" | "gravacao" | "edicao" | "publicacao";

export interface Item {
  id: string;
  title: string;
  notes?: string;
  type: ItemType;
  date: string | null; // ISO date (yyyy-MM-dd), null = backlog (no date yet)
  time?: string | null; // HH:mm
  createdAt: string;
  updatedAt?: string;
  scriptStage?: ScriptStage;
  done?: boolean;
}

export const TYPE_LABEL: Record<ItemType, string> = {
  idea: "Ideia",
  task: "Tarefa",
  event: "Compromisso",
  script: "Roteiro",
};

export const TYPE_COLOR: Record<ItemType, string> = {
  idea: "bg-amber-400",
  task: "bg-sky-500",
  event: "bg-blue-600",
  script: "bg-emerald-500",
};

export const TYPE_COLOR_SOFT: Record<ItemType, string> = {
  idea: "bg-amber-100 text-amber-700 border-amber-300",
  task: "bg-sky-100 text-sky-700 border-sky-300",
  event: "bg-blue-100 text-blue-700 border-blue-300",
  script: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

export const TYPE_GRADIENT: Record<ItemType, string> = {
  idea: "from-amber-400 to-orange-400",
  task: "from-sky-400 to-blue-500",
  event: "from-blue-600 to-cyan-500",
  script: "from-emerald-400 to-teal-500",
};

export const SCRIPT_STAGE_LABEL: Record<ScriptStage, string> = {
  rascunho: "Rascunho",
  gravacao: "Gravação",
  edicao: "Edição",
  publicacao: "Publicação",
};

// Days from creation within which each stage is expected to be reached.
export const STAGE_DEADLINE_DAYS: Record<ScriptStage, number> = {
  rascunho: 1,
  gravacao: 3,
  edicao: 5,
  publicacao: 7,
};
