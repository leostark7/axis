export type ClientStatus = "ativo" | "pausado" | "encerrado";

export interface Client {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

export const CLIENT_STATUS_COLOR: Record<ClientStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-700 border-emerald-300",
  pausado: "bg-amber-100 text-amber-700 border-amber-300",
  encerrado: "bg-[#101a2e]/10 text-[#101a2e]/60 border-[#101a2e]/20",
};
