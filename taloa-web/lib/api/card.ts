// Pet Identity Card — leitura publica por tag_code (sem auth).
import type { PetCard } from "@/types/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// URL do PDF (download/preview) — usada direto num link/anchor.
export function cardPdfUrl(tagCode: string): string {
  return `${API_URL}/v1/cards/${tagCode}/pdf`;
}

export async function getCard(tagCode: string): Promise<PetCard | null> {
  const res = await fetch(`${API_URL}/v1/cards/${tagCode}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
