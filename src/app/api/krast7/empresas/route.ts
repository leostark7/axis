import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireAuth";

export async function GET() {
  const { response: authError } = await requireUser();
  if (authError) return authError;

  const apiUrl = process.env.KRAST7_API_URL;
  const secret = process.env.KRAST7_INTEGRATION_SECRET;
  if (!apiUrl || !secret) {
    return NextResponse.json({ error: "Integração com o KRAST7 não configurada" }, { status: 500 });
  }

  try {
    const res = await fetch(`${apiUrl}/api/ingest/empresas`, {
      headers: { "x-integration-secret": secret },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Não foi possível buscar empresas do KRAST7" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Falha ao conectar com o KRAST7" }, { status: 500 });
  }
}
