export type ContactCategory = "orgao_publico" | "cliente" | "fornecedor" | "pessoal" | "outro";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  category: ContactCategory;
  region: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CONTACT_CATEGORY_LABEL: Record<ContactCategory, string> = {
  orgao_publico: "Órgão público",
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  pessoal: "Pessoal",
  outro: "Outro",
};

export const CONTACT_CATEGORY_COLOR: Record<ContactCategory, string> = {
  orgao_publico: "bg-indigo-100 text-indigo-700 border-indigo-300",
  cliente: "bg-blue-100 text-blue-700 border-blue-300",
  fornecedor: "bg-amber-100 text-amber-700 border-amber-300",
  pessoal: "bg-emerald-100 text-emerald-700 border-emerald-300",
  outro: "bg-[#101a2e]/10 text-[#101a2e]/60 border-[#101a2e]/20",
};
