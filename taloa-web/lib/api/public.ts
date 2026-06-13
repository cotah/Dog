import type { PublicTag } from "@/types/tag";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Busca os dados publicos da tag (sem auth). Retorna null se nao existir.
export async function getPublicTag(tagCode: string): Promise<PublicTag | null> {
  const res = await fetch(
    `${API_URL}/v1/tags/${encodeURIComponent(tagCode)}/public`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load tag");
  return res.json();
}

export interface ScanPayload {
  tag_code: string;
  action_taken?: string;
  user_agent?: string;
  ip?: string;
}

// Registra o scan no backend (best-effort — nunca quebra a pagina).
export async function logScan(data: ScanPayload): Promise<void> {
  try {
    await fetch(`${API_URL}/v1/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
  } catch {
    // scan e secundario; falha aqui nao afeta a experiencia
  }
}
