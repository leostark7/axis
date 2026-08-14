import { ItemType } from "./types";

export interface Classification {
  type: ItemType;
  title: string;
  date: string | null;
  time: string | null;
  clientName: string | null;
}

export async function classifyText(text: string, clientNames: string[] = []): Promise<Classification | null> {
  try {
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, clientNames }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Classification;
  } catch {
    return null;
  }
}
