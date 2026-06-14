import type { PublicTag } from "@/types/tag";
import type { PublicVet } from "@/types/vet";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Lista publica de clinicas veterinarias ativas (Emergency Directory).
export async function getVetClinics(): Promise<PublicVet[]> {
  const res = await fetch(`${API_URL}/v1/vets`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load vet clinics");
  return res.json();
}

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
