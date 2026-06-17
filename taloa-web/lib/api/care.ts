// Pet Sitter Share — CRUD autenticado (dono) + leitura publica por token.
import { apiFetch } from "@/lib/api/client";
import type { CareDuration, CareProfile, CareShare } from "@/types/care";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function createCareShare(
  petId: string,
  duration: CareDuration,
): Promise<CareShare> {
  return apiFetch<CareShare>("/v1/care-shares", {
    method: "POST",
    body: JSON.stringify({ pet_id: petId, duration }),
  });
}

export function listCareShares(petId: string): Promise<CareShare[]> {
  return apiFetch<CareShare[]>(`/v1/care-shares/pet/${petId}`);
}

export function revokeCareShare(id: string): Promise<unknown> {
  return apiFetch(`/v1/care-shares/${id}`, { method: "DELETE" });
}

// Publico (carer): perfil completo se o token for valido/nao expirado.
export async function getCare(token: string): Promise<CareProfile | null> {
  const res = await fetch(`${API_URL}/v1/care/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
