"use client";

import { useEffect, useMemo, useState } from "react";
import { useContactStore } from "@/lib/contactStore";
import { Contact, ContactCategory, CONTACT_CATEGORY_LABEL, CONTACT_CATEGORY_COLOR } from "@/lib/contactTypes";
import ContactModal from "@/components/ContactModal";
import { Search, Plus, Phone, Copy, MapPin } from "lucide-react";

const CATEGORIES: ContactCategory[] = ["orgao_publico", "cliente", "fornecedor", "pessoal", "outro"];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function TelefonesPage() {
  const init = useContactStore((s) => s.init);
  const contacts = useContactStore((s) => s.contacts);
  const [query, setQuery] = useState("");
  const [openContact, setOpenContact] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        normalize(c.name).includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        normalize(c.region ?? "").includes(q) ||
        normalize(CONTACT_CATEGORY_LABEL[c.category]).includes(q)
    );
  }, [contacts, query]);

  const grouped = useMemo(() => {
    const map = new Map<ContactCategory, Contact[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const c of filtered) map.get(c.category)?.push(c);
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold glow-text">📞 Agenda Telefônica</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] hover:brightness-110"
        >
          <Plus size={16} />
          Novo contato
        </button>
      </div>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        Números importantes num só lugar — órgãos públicos, clientes, fornecedores. Busca instantânea por nome, telefone ou região.
      </p>

      <div className="glass mb-6 flex items-center gap-2 rounded-2xl p-2">
        <Search size={16} className="ml-2 shrink-0 text-[#101a2e]/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque por nome, telefone, órgão ou região (ex: SEFAZ, Conquista, 3420)..."
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-[#101a2e] placeholder-[#101a2e]/35 outline-none"
        />
      </div>

      {filtered.length === 0 && (
        <p className="glass rounded-2xl border-dashed p-8 text-center text-sm text-[#101a2e]/40">
          {contacts.length === 0 ? "Nenhum contato cadastrado ainda." : "Nada encontrado pra essa busca."}
        </p>
      )}

      {CATEGORIES.map((cat) => {
        const list = grouped.get(cat) ?? [];
        if (list.length === 0) return null;
        return (
          <div key={cat} className="mb-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#101a2e]/50">
              {CONTACT_CATEGORY_LABEL[cat]} ({list.length})
            </h2>
            <div className="flex flex-col gap-2">
              {list.map((c) => (
                <div
                  key={c.id}
                  className="glass flex items-center gap-3 rounded-2xl p-3.5 shadow-sm"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${CONTACT_CATEGORY_COLOR[c.category]}`}
                  >
                    <Phone size={16} />
                  </div>
                  <button onClick={() => setOpenContact(c)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-semibold text-[#101a2e]">{c.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-[#101a2e]/50">
                      <span>{c.phone}</span>
                      {c.region && (
                        <span className="flex items-center gap-0.5">
                          <MapPin size={9} />
                          {c.region}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(c.phone)}
                    title="Copiar número"
                    className="shrink-0 rounded-lg border border-[#101a2e]/10 p-2 text-[#101a2e]/50 hover:bg-[#101a2e]/5"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`tel:${c.phone.replace(/\D/g, "")}`}
                    title="Ligar"
                    className="shrink-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 p-2 text-white"
                  >
                    <Phone size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {(openContact || creating) && (
        <ContactModal
          contact={openContact}
          onClose={() => {
            setOpenContact(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
