import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Você é o assistente do Axis, uma agenda inteligente. O usuário está numa
conversa de chat com você. Decida SEMPRE entre duas ações e responda APENAS com um JSON:

1. Se a mensagem é um PEDIDO PRA CAPTURAR algo (uma ideia, tarefa, compromisso, roteiro,
   demanda — qualquer coisa que deveria virar um item na agenda):
{"action": "capture", "reply": string, "item": {"type": "idea"|"task"|"event"|"script", "title": string, "date": "YYYY-MM-DD"|null, "time": "HH:mm"|null, "emoji": string, "clientName": string|null}}

2. Se é uma PERGUNTA sobre a agenda, uma conversa, ou qualquer outra coisa que não deveria
   virar um item novo:
{"action": "answer", "reply": string}

Regras pro "capture":
- "event": compromissos com outra pessoa, reuniões, ligações — geralmente têm hora.
- "task": afazeres pontuais sem envolver outra pessoa.
- "script": roteiros, vídeos, gravações, conteúdo a produzir.
- "idea": qualquer ideia solta, sem ação imediata clara.
- Calcule datas relativas ("hoje", "amanhã", "sexta") a partir da data de hoje informada.
- "emoji": escolha UM emoji único que representa bem o conteúdo (estilo Toki — ex: reunião de
  negócios = 🤝, roteiro de vídeo = 🎬, ideia = 💡). Nunca deixe vazio.
- "clientName": se mencionar um cliente que bate com a lista fornecida, retorne o nome exato da
  lista. Senão, null. Nunca invente.
- "reply": uma confirmação curta e amigável (1 frase), tipo "Beleza, adicionei isso pra você!".

Regras pro "answer":
- Responda em português, curto, baseado SOMENTE no contexto da agenda fornecido. Nunca invente
  dados que não estejam no contexto.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
  }

  const { message, context, clientNames } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "mensagem inválida" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const clientsList = Array.isArray(clientNames) ? clientNames.join(", ") : "";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Hoje é ${today}. Clientes cadastrados: [${clientsList}].\nContexto da agenda:\n${context ?? "sem dados"}\n\nMensagem do usuário: "${message}"`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    if (parsed.action === "capture" && parsed.item) {
      const validTypes = ["idea", "task", "event", "script"];
      if (!validTypes.includes(parsed.item.type)) parsed.item.type = "idea";
      return NextResponse.json({
        action: "capture",
        reply: parsed.reply ?? "Adicionado!",
        item: {
          type: parsed.item.type,
          title: typeof parsed.item.title === "string" ? parsed.item.title.trim() : message,
          date: parsed.item.date ?? null,
          time: parsed.item.time ?? null,
          emoji: typeof parsed.item.emoji === "string" ? parsed.item.emoji : "📌",
          clientName: typeof parsed.item.clientName === "string" ? parsed.item.clientName : null,
        },
      });
    }

    return NextResponse.json({ action: "answer", reply: parsed.reply ?? "Não consegui responder." });
  } catch {
    return NextResponse.json({ error: "Falha ao processar" }, { status: 500 });
  }
}
