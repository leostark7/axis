"use client";

import { useEffect, useMemo, useState } from "react";
import { useClientStore } from "@/lib/clientStore";
import { Client, TAX_REGIME_LABEL, TaxRegime } from "@/lib/clientTypes";
import { X, Loader2, Building2, Check, RefreshCw } from "lucide-react";

type Empresa = {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  ie: string | null;
  regime: TaxRegime | null;
};

function onlyDigits(v: string | null) {
  return (v ?? "").replace(/\D/g, "");
}

type Row =
  | { kind: "new"; empresa: Empresa }
  | { kind: "update"; empresa: Empresa; client: Client; changedFields: string[] }
  | { kind: "synced"; empresa: Empresa; client: Client };

export default function Krast7ImportModal({ onClose }: { onClose: () => void }) {
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
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

  const rows: Row[] = useMemo(() => {
    return empresas.map((e) => {
      const match = clients.find((c) => onlyDigits(c.cnpj) && onlyDigits(c.cnpj) === onlyDigits(e.cnpj));
      if (!match) return { kind: "new", empresa: e };

      const changedFields: string[] = [];
      if (e.regime && e.regime !== match.taxRegime) changedFields.push("Regime tributário");
      if (e.ie && e.ie !== match.stateRegistration) changedFields.push("Inscrição Estadual");
      if (e.telefone && e.telefone !== match.contactPhone) changedFields.push("Telefone");
      if (e.endereco && e.endereco !== match.address) changedFields.push("Endereço");

      if (changedFields.length === 0) return { kind: "synced", empresa: e, client: match };
      return { kind: "update", empresa: e, client: match, changedFields };
    });
  }, [empresas, clients]);

  const actionable = rows.filter((r) => r.kind !== "synced");

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
    const toProcess = actionable.filter((r) => selected.has(r.empresa.id));
    for (const row of toProcess) {
      const e = row.empresa;
      if (row.kind === "new") {
        await addClient({
          name: e.nome,
          contactPhone: e.telefone ?? undefined,
          cnpj: e.cnpj,
          address: e.endereco,
          stateRegistration: e.ie,
          taxRegime: e.regime,
        });
      } else {
        await updateClient(row.client.id, {
          ...(e.regime && { taxRegime: e.regime }),
          ...(e.ie && { stateRegistration: e.ie }),
          ...(e.telefone && { contactPhone: e.telefone }),
          ...(e.endereco && { address: e.endereco }),
        });
      }
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
            Importar / Sincronizar com o KRAST7
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
          {!loading && !error && rows.length === 0 && (
            <p className="p-6 text-center text-xs text-[#101a2e]/40">Nenhuma empresa encontrada no KRAST7.</p>
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {rows.map((row) => {
                const e = row.empresa;
                const isSynced = row.kind === "synced";
                const isSelected = selected.has(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => !isSynced && toggle(e.id)}
                    disabled={isSynced}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-xs transition ${
                      isSynced
                        ? "cursor-not-allowed border-[#101a2e]/10 bg-[#101a2e]/[0.03] opacity-50"
                        : isSelected
                          ? row.kind === "update"
                            ? "border-amber-400 bg-amber-50"
                            : "border-blue-400 bg-blue-50"
                          : "border-[#101a2e]/10 bg-white/40 hover:bg-[#101a2e]/[0.03]"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        isSelected
                          ? row.kind === "update"
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-blue-500 bg-blue-500 text-white"
                          : "border-[#101a2e]/20"
                      }`}
                    >
                      {isSelected && (row.kind === "update" ? <RefreshCw size={11} /> : <Check size={12} />)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-[#101a2e]">{e.nome}</div>
                      <div className="truncate text-[10px] text-[#101a2e]/45">
                        {row.kind === "synced" && "Já sincronizado com o Axis"}
                        {row.kind === "update" && (
                          <span className="font-semibold text-amber-700">
                            Atualizar: {row.changedFields.join(", ")}
                          </span>
                        )}
                        {row.kind === "new" &&
                          ([e.telefone, e.regime ? TAX_REGIME_LABEL[e.regime] : null, e.endereco]
                            .filter(Boolean)
                            .join(" · ") || "Sem telefone/endereço")}
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
                Processando {done}/{selected.size}...
              </>
            ) : (
              `Importar / Atualizar ${selected.size || ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
