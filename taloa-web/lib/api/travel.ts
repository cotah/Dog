// Cliente da API do Travel Checklist (Etapa 28). Tudo autenticado.
import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, TripDetail, TripPayload, TripSummary } from "@/types/travel";

// client.ts nao exporta a base URL; duplicado de proposito (mesmo default).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getTrips(petId: string): Promise<TripSummary[]> {
  return apiFetch<TripSummary[]>(`/v1/pets/${petId}/trips`);
}

export function createTrip(petId: string, body: TripPayload): Promise<TripDetail> {
  return apiFetch<TripDetail>(`/v1/pets/${petId}/trips`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getTrip(tripId: string): Promise<TripDetail> {
  return apiFetch<TripDetail>(`/v1/trips/${tripId}`);
}

export function deleteTrip(tripId: string): Promise<unknown> {
  return apiFetch(`/v1/trips/${tripId}`, { method: "DELETE" });
}

export function addCustomItem(tripId: string, label: string): Promise<ChecklistItem> {
  return apiFetch<ChecklistItem>(`/v1/trips/${tripId}/items`, {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export function toggleItem(
  tripId: string,
  itemId: string,
  isChecked: boolean,
): Promise<ChecklistItem> {
  return apiFetch<ChecklistItem>(`/v1/trips/${tripId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_checked: isChecked }),
  });
}

export function deleteItem(tripId: string, itemId: string): Promise<unknown> {
  return apiFetch(`/v1/trips/${tripId}/items/${itemId}`, { method: "DELETE" });
}

// PDF autenticado: apiFetch so faz JSON, entao aqui e fetch manual com blob.
export async function downloadTripPdf(tripId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  const res = await fetch(`${API_URL}/v1/trips/${tripId}/pdf`, { headers });
  if (!res.ok) throw new Error("PDF download failed");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "taloa-travel-checklist.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
