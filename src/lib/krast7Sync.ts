import { Client, TaxRegime } from "./clientTypes";

type Empresa = {
  id: string;
  cnpj: string | null;
  ie: string | null;
  regime: TaxRegime | null;
};

function onlyDigits(v: string | null) {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Sincroniza silenciosamente o regime tributário e a Inscrição Estadual
 * dos clientes já importados do KRAST7 (casados por CNPJ), sem criar
 * clientes novos e sem tocar em nenhum outro campo.
 */
export async function syncKrast7Regimes(
  clients: Client[],
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>
): Promise<number> {
  try {
    const res = await fetch("/api/krast7/empresas");
    if (!res.ok) return 0;
    const data = await res.json();
    const empresas: Empresa[] = data.empresas ?? [];

    let count = 0;
    for (const client of clients) {
      const clientCnpj = onlyDigits(client.cnpj);
      if (!clientCnpj) continue;
      const match = empresas.find((e) => onlyDigits(e.cnpj) === clientCnpj);
      if (!match) continue;

      const patch: Partial<Client> = {};
      if (match.regime && match.regime !== client.taxRegime) patch.taxRegime = match.regime;
      if (match.ie && match.ie !== client.stateRegistration) patch.stateRegistration = match.ie;

      if (Object.keys(patch).length > 0) {
        await updateClient(client.id, patch);
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}
