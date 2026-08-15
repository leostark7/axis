"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { useAxisStore } from "@/lib/store";
import { useDemandStore } from "@/lib/demandStore";
import { useClientStore } from "@/lib/clientStore";
import { useChatUiStore } from "@/lib/chatUiStore";
import { TYPE_LABEL } from "@/lib/types";
import { DEMANDA_STATUS_LABEL } from "@/lib/demandTypes";
import VoiceButton from "./VoiceButton";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildContext(
  items: ReturnType<typeof useAxisStore.getState>["items"],
  demandas: ReturnType<typeof useDemandStore.getState>["demandas"]
) {
  const now = new Date();
  const lines: string[] = [`Hoje é ${format(now, "dd/MM/yyyy")}.`];

  lines.push("--- Itens da agenda ---");
  for (const it of items) {
    const parts = [TYPE_LABEL[it.type], `"${it.title}"`];
    if (it.date) parts.push(`data: ${it.date}${it.time ? " " + it.time : ""}`);
    else parts.push("sem data (backlog)");
    if (it.done) parts.push("[concluído]");
    if (it.scriptStage) parts.push(`etapa: ${it.scriptStage}`);
    lines.push("- " + parts.join(", "));
  }

  lines.push("--- Demandas ---");
  for (const d of demandas) {
    const parts = [
      `"${d.title}"`,
      `status: ${DEMANDA_STATUS_LABEL[d.status]}`,
      d.dueDate ? `prazo: ${d.dueDate}` : "sem prazo",
      `anexos: ${d.attachments.length}`,
    ];
    lines.push("- " + parts.join(", "));
  }

  return lines.join("\n");
}

export default function AxisChat() {
  const pathname = usePathname();
  const items = useAxisStore((s) => s.items);
  const addItem = useAxisStore((s) => s.addItem);
  const demandas = useDemandStore((s) => s.demandas);
  const initDemandas = useDemandStore((s) => s.init);
  const clients = useClientStore((s) => s.clients);
  const initClients = useClientStore((s) => s.init);
  const open = useChatUiStore((s) => s.open);
  const setOpen = useChatUiStore((s) => s.setOpen);
  const toggleOpen = useChatUiStore((s) => s.toggle);
  const voiceTrigger = useChatUiStore((s) => s.voiceTrigger);

  useEffect(() => {
    initDemandas();
    initClients();
  }, [initDemandas, initClients]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (pathname === "/login") return null;

  async function send(overrideText?: string) {
    const text = overrideText ?? input;
    if (!text.trim() || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const context = buildContext(items, demandas);
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          context,
          clientNames: clients.map((c) => c.name),
        }),
      });
      const data = await res.json();

      if (data.action === "capture" && data.item) {
        const matchedClient = clients.find(
          (c) => c.name.toLowerCase() === data.item.clientName?.toLowerCase()
        );
        await addItem({
          title: `${data.item.emoji} ${data.item.title}`,
          type: data.item.type,
          date: data.item.date,
          time: data.item.time,
          clientId: matchedClient?.id ?? null,
        });
        setMessages((m) => [...m, { role: "assistant", content: `${data.item.emoji} ${data.reply}` }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply || "Não consegui responder." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Falha ao conversar. Tenta de novo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={toggleOpen}
        title="Conversar e capturar com a IA"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-[0_10px_24px_-6px_rgba(37,99,235,0.6)] transition hover:scale-105"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <div className="glass fixed bottom-40 right-6 z-40 flex h-[32rem] w-[26rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl shadow-2xl">
          <div className="border-b border-[#101a2e]/10 px-4 py-3">
            <div className="text-sm font-bold text-[#101a2e]">✨ Assistente Axis</div>
            <div className="text-[11px] text-[#101a2e]/60">
              Fale ou digite — eu capturo direto na agenda ou respondo suas perguntas
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="text-xs text-[#101a2e]/55">
                Ex: "reunião com o Cliente A amanhã às 10h", "o que tenho atrasado?", "resume minhas
                demandas"
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                  m.role === "user"
                    ? "ml-auto bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    : "bg-[#101a2e]/5 text-[#101a2e]/80"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-[#101a2e]/60">
                <Loader2 size={12} className="animate-spin" />
                pensando...
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-[#101a2e]/10 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Fale ou digite..."
              className="min-w-0 flex-1 rounded-xl bg-[#101a2e]/5 px-3 py-2 text-xs text-[#101a2e] outline-none placeholder-[#101a2e]/35"
            />
            <VoiceButton onResult={(text) => send(text)} autoStart={voiceTrigger} />
            <button
              onClick={() => send()}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-2 text-white disabled:opacity-60"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
