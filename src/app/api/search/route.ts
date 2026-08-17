import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/requireAuth";

const SYSTEM_PROMPT = `Você é o buscador semântico do Axis. Vai receber uma pergunta/busca do
usuário e uma lista de itens (com id, tipo e título/descrição). Retorne APENAS um JSON no formato:
{"ids": ["id1", "id2", ...]}
Liste, em ordem de relevância, os IDs dos itens que combinam com o sentido da busca — não apenas
correspondência exata de palavras. Entenda sinônimos, contexto e datas relativas. Se nada combinar
bem, retorne uma lista vazia. Nunca invente um ID que não esteja na lista fornecida.`;

export async function POST(req: NextRequest) {
  const { response: authError } = await requireUser();
  if (authError) return authError;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
  }

  const { query, candidates } = await req.json();
  if (!query || !Array.isArray(candidates)) {
    return NextResponse.json({ error: "parâmetros inválidos" }, { status: 400 });
  }
  if (candidates.length === 0) {
    return NextResponse.json({ ids: [] });
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
        response_format: { type: "json_object" },
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Busca: "${query}"\n\nItens:\n${JSON.stringify(candidates)}`,
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
    const ids = Array.isArray(parsed.ids) ? parsed.ids.filter((x: unknown) => typeof x === "string") : [];
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ error: "Falha na busca" }, { status: 500 });
  }
}
