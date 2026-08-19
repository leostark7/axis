"use client";

import { useState } from "react";
import { useContactStore } from "@/lib/contactStore";
import { Contact, ContactCategory, CONTACT_CATEGORY_LABEL } from "@/lib/contactTypes";
import { X, Trash2, Phone } from "lucide-react";

const CATEGORIES: ContactCategory[] = ["orgao_publico", "cliente", "fornecedor", "pessoal", "outro"];

export default function ContactModal({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) {
  const addContact = useContactStore((s) => s.addContact);
  const updateContact = useContactStore((s) => s.updateContact);
  const removeContact = useContactStore((s) => s.removeContact);

  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [category, setCategory] = useState<ContactCategory>(contact?.category ?? "orgao_publico");
  const [region, setRegion] = useState(contact?.region ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");

  async function handleSave() {
    if (!name.trim() || !phone.trim()) return;
    if (contact) {
      await updateContact(contact.id, {
        name: name.trim(),
        phone: phone.trim(),
        category,
        region: region.trim() || null,
        notes: notes.trim() || null,
      });
    } else {
      await addContact({ name: name.trim(), phone: phone.trim(), category, region, notes });
    }
    onClose();
  }

  async function handleDelete() {
    if (!contact) return;
    await removeContact(contact.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101a2e]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#101a2e]/60">
            <Phone size={13} />
            {contact ? "Editar contato" : "Novo contato"}
          </span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10">
            <X size={16} />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (ex: SEFAZ-BA, Receita Federal, Contador Fulano)"
          className="mb-3 w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-sm font-medium text-[#101a2e] outline-none focus:border-blue-400"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone"
          className="mb-3 w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-sm text-[#101a2e] outline-none focus:border-blue-400"
        />

        <div className="mb-3 grid grid-cols-2 gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ContactCategory)}
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-2 py-2.5 text-xs font-medium text-[#101a2e] outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CONTACT_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Região (ex: Vitória da Conquista)"
            className="rounded-xl border border-[#101a2e]/10 bg-white/70 px-3 py-2.5 text-xs text-[#101a2e] outline-none"
          />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional) — horário de atendimento, ramal, etc."
          rows={2}
          className="mb-4 w-full resize-none rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-xs text-[#101a2e] outline-none placeholder-[#101a2e]/35 focus:border-blue-400"
        />

        <div className="flex items-center justify-between">
          {contact ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
            >
              <Trash2 size={13} />
              Excluir
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] hover:brightness-110"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
