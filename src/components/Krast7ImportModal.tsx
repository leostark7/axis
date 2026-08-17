"use client";

import { useEffect, useState } from "react";
import { useClientStore } from "@/lib/clientStore";
import { Client } from "@/lib/clientTypes";
import { X, Loader2, Building2, Check } from "lucide-react";

type Empresa = {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
};

function onlyDigits(v: string | null) {
  return (v ?? "").replace(/\D/g, "");
}

export default function Krast7ImportModal({ onClose }: { onClose: () => void }) {
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    fetch("/api/krast7/empresas")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setEmpresas(data.empresas ?? []);
      })
      .catch(() => setError("Não foi possível buscar empresas do KRAST7."))
      .finally(() => setLoading(false));
  }, []);

  const existingCnpjs = new Set(clients.map((c: Client) => onlyDigits(c.cnpj)).filter(Boolean));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleImport() {
    setImporting(true);
    setDone(0);
    const toImport = empresas.filter((e) => selected.has(e.id));
    for (const e of toImport) {
      await addClient({
        name: e.nome,
        contactPhone: e.telefone ?? undefined,
        cnpj: e.cnpj,
        address: e.endereco,
      });
      setDone((d) => d + 1);
    }
    setImporting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101a2e]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#101a2e]/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#101a2e]">
            <Building2 size={15} className="text-blue-600" />
            Importar do KRAST7
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#101a2e]/50">
              <Loader2 size={16} className="animate-spin" />
              Buscando empresas cadastradas no KRAST7...
            </div>
          )}
          {error && <p className="rounded-xl bg-red-50 p-4 text-xs text-red-600">{error}</p>}
          {!loading && !error && empresas.length === 0 && (
            <p className="p-6 text-center text-xs text-[#101a2e]/40">Nenhuma empresa encontrada no KRAST7.</p>
          )}
          {!loading && !error && empresas.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {empresas.map((e) => {
                const already = existingCnpjs.has(onlyDigits(e.cnpj));
                return (
                  <button
                    key={e.id}
                    onClick={() => !already && toggle(e.id)}
                    disabled={already}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-xs transition ${
                      already
                        ? "cursor-not-allowed border-[#101a2e]/10 bg-[#101a2e]/[0.03] opacity-50"
                        : selected.has(e.id)
                          ? "border-blue-400 bg-blue-50"
                          : "border-[#101a2e]/10 bg-white/40 hover:bg-[#101a2e]/[0.03]"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        selected.has(e.id) ? "border-blue-500 bg-blue-500 text-white" : "border-[#101a2e]/20"
                      }`}
                    >
                      {selected.has(e.id) && <Check size={12} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-[#101a2e]">{e.nome}</div>
                      <div className="truncate text-[10px] text-[#101a2e]/45">
                        {already ? "Já cadastrado no Axis" : [e.telefone, e.endereco].filter(Boolean).join(" · ") || "Sem telefone/endereço"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#101a2e]/10 px-5 py-3">
          <span className="text-xs text-[#101a2e]/45">
            {selected.size} selecionada{selected.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleImport}
            disabled={selected.size === 0 || importing}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Importando {done}/{selected.size}...
              </>
            ) : (
              `Importar ${selected.size || ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
