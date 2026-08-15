import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Você classifica anotações rápidas de uma agenda chamada Axis.
Dado um texto em português do usuário e uma lista de clientes já cadastrados, retorne APENAS um
JSON com este formato exato:
{"type": "idea" | "task" | "event" | "script", "title": string, "date": "YYYY-MM-DD" | null, "time": "HH:mm" | null, "clientName": string | null, "emoji": string}

Regras:
- "event": compromissos com outra pessoa, reuniões, ligações — geralmente têm hora.
- "task": afazeres pontuais sem envolver outra pessoa.
- "script": roteiros, vídeos, gravações, conteúdo a produzir.
- "idea": qualquer ideia solta, sem ação imediata clara.
- Se o texto mencionar um dia relativo ("hoje", "amanhã", "sexta", "dia 20"), calcule a data real usando a data de hoje informada.
- Se não houver data/hora explícita, retorne null para ambos.
- "title" deve ser o texto limpo, sem as palavras de data/hora redundantes, mantendo a essência.
- Nunca invente hora se não houver indício.
- "clientName": se o texto mencionar um cliente que bate (mesmo que parcialmente/case-insensitive) com algum nome da lista de clientes fornecida, retorne o nome EXATO como está na lista. Se não mencionar cliente nenhum ou não bater com a lista, retorne null. Nunca invente um nome de cliente que não esteja na lista.
- "emoji": escolha UM emoji único que representa bem o conteúdo (ex: reunião de negócios = 🤝, roteiro de vídeo = 🎬, ideia = 💡, viagem = ✈️). Nunca deixe vazio.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
  }

  const { text, clientNames } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "texto inválido" }, { status: 400 });
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
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Hoje é ${today}. Clientes cadastrados: [${clientsList}]. Texto: "${text}"`,
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

    const validTypes = ["idea", "task", "event", "script"];
    if (!validTypes.includes(parsed.type)) parsed.type = "idea";

    return NextResponse.json({
      type: parsed.type,
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : text,
      date: parsed.date ?? null,
      time: parsed.time ?? null,
      clientName: typeof parsed.clientName === "string" ? parsed.clientName : null,
      emoji: typeof parsed.emoji === "string" && parsed.emoji ? parsed.emoji : "📌",
    });
  } catch {
    return NextResponse.json({ error: "Falha ao classificar" }, { status: 500 });
  }
}
