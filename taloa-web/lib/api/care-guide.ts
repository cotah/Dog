// Cliente da API do Exotic Care Guide (Etapa 29). Tudo autenticado.
import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import type { CareGuideResponse } from "@/types/care-guide";

// client.ts nao exporta a base URL; duplicado de proposito (mesmo default).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getCareGuide(petId: string): Promise<CareGuideResponse> {
  return apiFetch<CareGuideResponse>(`/v1/pets/${petId}/care-guide`);
}

// PDF autenticado: apiFetch so faz JSON, entao aqui e fetch manual com blob.
export async function downloadCareGuidePdf(petId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  const res = await fetch(`${API_URL}/v1/pets/${petId}/care-guide/pdf`, { headers });
  if (!res.ok) throw new Error("PDF download failed");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "taloa-care-guide.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
