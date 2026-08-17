import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/requireAuth";

const SYSTEM_PROMPT = `Você é o assistente do Axis, a agenda inteligente da LS Brainstorm.
Responda em português do Brasil, curto e direto (poucas linhas), como se estivesse
conversando por chat. Use APENAS os dados fornecidos no contexto para responder —
nunca invente itens, prazos ou nomes que não estejam lá. Se não souber, diga que não
tem essa informação na agenda. Não use markdown pesado, só texto corrido com quebras
de linha e "-" para listas simples quando fizer sentido.`;

export async function POST(req: NextRequest) {
  const { response: authError } = await requireUser();
  if (authError) return authError;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
  }

  const { context, messages } = await req.json();
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "mensagens inválidas" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: `Contexto atual da agenda:\n${context ?? "sem dados"}` },
          ...messages,
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Falha ao conversar" }, { status: 500 });
  }
}
