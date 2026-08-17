import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/requireAuth";

const SYSTEM_PROMPT = `Você é um analista de produtividade que olha estatísticas de uma agenda
chamada Axis e escreve uma análise de padrões — não um resumo do dia, e sim tendências.
Responda em português do Brasil, direto, no máximo 6 linhas, com bullets curtos usando "-".
Aponte: em que dias da semana a pessoa mais agenda coisas, se ela costuma atrasar tarefas,
qual tipo de item mais se acumula sem ser feito, e UMA sugestão prática baseada nos dados.
Nunca invente números que não estejam nos dados fornecidos.`;

export async function POST(req: NextRequest) {
  const { response: authError } = await requireUser();
  if (authError) return authError;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
  }

  const { stats } = await req.json();
  if (!stats || typeof stats !== "string") {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
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
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Dados da agenda:\n${stats}` },
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
    return NextResponse.json({ error: "Falha ao analisar" }, { status: 500 });
  }
}
