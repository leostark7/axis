"use client";

import { useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMessageStore } from "@/lib/messageStore";
import { useDemandStore } from "@/lib/demandStore";
import { createClient } from "@/lib/supabase/client";
import VoiceButton from "@/components/VoiceButton";
import { Send, Paperclip, Loader2, FileText, X } from "lucide-react";

const supabase = createClient();

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "d 'de' MMMM", { locale: ptBR });
}

function isImage(name: string) {
  return /\.(png|jpe?g|gif|webp)$/i.test(name);
}

export default function MensagensPage() {
  const init = useMessageStore((s) => s.init);
  const messages = useMessageStore((s) => s.messages);
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const initProfiles = useDemandStore((s) => s.init);
  const profiles = useDemandStore((s) => s.profiles);
  const [body, setBody] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    initProfiles();
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, [init, initProfiles]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function nameFor(id: string | null) {
    if (!id) return "Alguém";
    if (id === myId) return "Você";
    return profiles.find((p) => p.id === id)?.email.split("@")[0] ?? "Alguém";
  }

  async function handleSend(overrideText?: string) {
    const text = overrideText ?? body;
    if (!text.trim()) return;
    await sendMessage({ body: text });
    setBody("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("mensagens").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("mensagens").getPublicUrl(path);
      await sendMessage({ attachmentUrl: data.publicUrl, attachmentName: file.name });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const grouped: Record<string, typeof messages> = {};
  for (const m of messages) {
    const key = dayLabel(m.createdAt);
    (grouped[key] ??= []).push(m);
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col p-4 md:p-6">
      <h1 className="mb-1 text-2xl font-bold glow-text">💬 Mensagens</h1>
      <p className="mb-4 text-sm text-[#101a2e]/50">Conversa direta entre vocês, sem sair do Axis.</p>

      <div className="mb-3 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center text-sm text-[#101a2e]/40">
            Nenhuma mensagem ainda. Manda um "oi" pra começar.
          </p>
        )}
        {Object.entries(grouped).map(([day, dayMessages]) => (
          <div key={day}>
            <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-[#101a2e]/35">
              {day}
            </div>
            <div className="flex flex-col gap-2">
              {dayMessages.map((m) => {
                const mine = m.senderId === myId;
                return (
                  <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        mine
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                          : "glass text-[#101a2e]"
                      }`}
                    >
                      {!mine && (
                        <div className="mb-0.5 text-[10px] font-semibold opacity-60">{nameFor(m.senderId)}</div>
                      )}
                      {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                      {m.attachmentUrl &&
                        (isImage(m.attachmentName ?? "") ? (
                          <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.attachmentUrl}
                              alt={m.attachmentName ?? ""}
                              className="mt-1 max-h-48 rounded-lg object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={m.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs underline ${
                              mine ? "bg-white/15" : "bg-[#101a2e]/5"
                            }`}
                          >
                            <FileText size={13} />
                            {m.attachmentName}
                          </a>
                        ))}
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className={`text-[10px] ${mine ? "text-white/70" : "text-[#101a2e]/40"}`}>
                          {format(new Date(m.createdAt), "HH:mm")}
                        </span>
                        {mine && (
                          <button
                            onClick={() => removeMessage(m.id)}
                            className="hidden text-white/60 hover:text-white group-hover:block"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="glass flex items-center gap-2 rounded-2xl p-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Anexar arquivo"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#101a2e]/50 hover:bg-[#101a2e]/5 disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        </button>
        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Escreva uma mensagem..."
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[#101a2e] placeholder-[#101a2e]/35 outline-none"
        />
        <VoiceButton onResult={(text) => handleSend(text)} />
        <button
          onClick={() => handleSend()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
