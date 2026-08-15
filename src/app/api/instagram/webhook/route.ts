import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `Você é o assistente do Axis, uma agenda inteligente, respondendo por DM do
Instagram. Decida SEMPRE entre duas ações e responda APENAS com um JSON:

1. Se a mensagem é um PEDIDO PRA CAPTURAR algo (ideia, tarefa, compromisso, roteiro):
{"action": "capture", "reply": string, "item": {"type": "idea"|"task"|"event"|"script", "title": string, "date": "YYYY-MM-DD"|null, "time": "HH:mm"|null, "emoji": string}}

2. Qualquer outra coisa:
{"action": "answer", "reply": string}

Regras: "event" = compromisso com hora/pessoa, "task" = afazer pontual, "script" = roteiro/vídeo,
"idea" = ideia solta. Calcule datas relativas a partir da data de hoje informada. "emoji": um
emoji que representa o conteúdo. "reply": confirmação curta e amigável, 1 frase.`;

function verifySignature(body: string, signature: string | null, appSecret: string) {
  if (!signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function classify(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Hoje é ${today}. Mensagem: "${text}"` },
      ],
    }),
  });
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

async function sendReply(recipientId: string, text: string) {
  const token = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!appSecret || !verifySignature(raw, signature, appSecret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(raw);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const text = event.message?.text;
      if (!senderId || !text || event.message?.is_echo) continue;

      try {
        const parsed = await classify(text);

        if (parsed.action === "capture" && parsed.item) {
          const validTypes = ["idea", "task", "event", "script"];
          const type = validTypes.includes(parsed.item.type) ? parsed.item.type : "idea";
          const emoji = typeof parsed.item.emoji === "string" ? parsed.item.emoji : "📌";
          await supabase.from("items").insert({
            title: `${emoji} ${parsed.item.title ?? text}`,
            type,
            date: parsed.item.date ?? null,
            time: parsed.item.time ?? null,
            script_stage: type === "script" ? "rascunho" : null,
          });
          await sendReply(senderId, `${emoji} ${parsed.reply ?? "Adicionado no Axis!"}`);
        } else {
          await sendReply(senderId, parsed.reply ?? "Recebido!");
        }
      } catch {
        await sendReply(senderId, "Deu ruim aqui pra processar isso, tenta de novo.");
      }
    }
  }

  return NextResponse.json({ ok: true });
}
