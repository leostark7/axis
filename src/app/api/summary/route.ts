import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/requireAuth";

const SYSTEM_PROMPT = `Você é o assistente da agenda Axis, da LS Brainstorm.
Escreva um resumo curto, direto e em português do Brasil, em tom leve mas profissional,
com no máximo 5 linhas, usando os dados fornecidos sobre itens da agenda (ideias, tarefas,
roteiros, compromissos). Destaque o que precisa de atenção agora e o que está parado há
muito tempo. Não invente dados que não foram fornecidos. Não use markdown, só texto corrido
com quebras de linha simples.`;

export async function POST(req: NextRequest) {
  const { response: authError } = await requireUser();
  if (authError) return authError;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
  }

  const { context, kind } = await req.json();
  if (!context || typeof context !== "string") {
    return NextResponse.json({ error: "contexto inválido" }, { status: 400 });
  }

  const label = kind === "week" ? "resumo semanal" : "resumo do dia";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Gere um ${label} com base nestes dados:\n${context}` },
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
    return NextResponse.json({ error: "Falha ao gerar resumo" }, { status: 500 });
  }
}
