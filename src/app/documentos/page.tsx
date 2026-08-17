"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDocumentStore } from "@/lib/documentStore";
import { useClientStore } from "@/lib/clientStore";
import { isFileTooLarge } from "@/lib/uploadLimits";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2, FileText, Trash2, Building2 } from "lucide-react";

const supabase = createClient();
const CATEGORIES = ["geral", "contrato", "financeiro", "marca", "outro"];

export default function DocumentosPage() {
  const init = useDocumentStore((s) => s.init);
  const documents = useDocumentStore((s) => s.documents);
  const addDocument = useDocumentStore((s) => s.addDocument);
  const removeDocument = useDocumentStore((s) => s.removeDocument);
  const initClients = useClientStore((s) => s.init);
  const clients = useClientStore((s) => s.clients);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
    initClients();
  }, [init, initClients]);

  function clientNameFor(id: string | null) {
    if (!id) return null;
    return clients.find((c) => c.id === id)?.name ?? null;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isFileTooLarge(file)) {
      alert("Arquivo maior que 20 MB. Escolha um arquivo menor.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documentos").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("documentos").getPublicUrl(path);
      await addDocument({ name: file.name, url: data.publicUrl, size: file.size });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const filtered = documents.filter((d) => filter === "all" || d.category === filter);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">🗂️ Documentos</h1>
      <p className="mb-5 text-sm text-[#101a2e]/50">
        Arquivos da empresa que não pertencem a uma demanda específica — contratos, modelos, propostas.
      </p>

      <div className="glass mb-5 flex items-center justify-between gap-2 rounded-2xl p-4">
        <div>
          <div className="text-sm font-semibold text-[#101a2e]">Subir novo arquivo</div>
          <div className="text-xs text-[#101a2e]/40">PDF, imagem, planilha — qualquer formato.</div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] hover:brightness-110 disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Enviar
        </button>
        <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition ${
              filter === c
                ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "border-[#101a2e]/15 text-[#101a2e]/60 hover:bg-[#101a2e]/5"
            }`}
          >
            {c === "all" ? "Tudo" : c}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="glass rounded-2xl border-dashed p-8 text-center text-sm text-[#101a2e]/40">
            Nenhum documento aqui ainda.
          </p>
        )}
        {filtered.map((d) => (
          <div key={d.id} className="glass flex items-center gap-3 rounded-2xl p-3.5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-sm font-medium text-[#101a2e] hover:underline"
              >
                {d.name}
              </a>
              <div className="flex items-center gap-2 text-[11px] text-[#101a2e]/50">
                <span className="capitalize">{d.category}</span>
                <span>·</span>
                <span>{(d.size / 1024).toFixed(0)} KB</span>
                <span>·</span>
                <span>{format(new Date(d.createdAt), "d MMM", { locale: ptBR })}</span>
                {clientNameFor(d.clientId) && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Building2 size={10} />
                      {clientNameFor(d.clientId)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => removeDocument(d.id)}
              className="shrink-0 rounded-lg border border-[#101a2e]/10 p-2 text-[#101a2e]/50 hover:bg-red-100 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
