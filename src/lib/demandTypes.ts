export type DemandaStatus = "aberta" | "andamento" | "concluida";

export interface Attachment {
  name: string;
  url: string;
  size: number;
}

export interface Profile {
  id: string;
  email: string;
}

export interface Demanda {
  id: string;
  title: string;
  description: string | null;
  status: DemandaStatus;
  requestedBy: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface DemandaComment {
  id: string;
  demandaId: string;
  authorId: string | null;
  body: string;
  createdAt: string;
}

export const DEMANDA_STATUS_LABEL: Record<DemandaStatus, string> = {
  aberta: "Aberta",
  andamento: "Em andamento",
  concluida: "Concluída",
};

export const DEMANDA_STATUS_COLOR: Record<DemandaStatus, string> = {
  aberta: "bg-amber-100 text-amber-700 border-amber-300",
  andamento: "bg-blue-100 text-blue-700 border-blue-300",
  concluida: "bg-emerald-100 text-emerald-700 border-emerald-300",
};
