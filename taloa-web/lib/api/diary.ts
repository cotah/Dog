// Cliente da API do Pet Diary (Etapa 27). Tudo autenticado (apiFetch anexa JWT).
import { apiFetch } from "@/lib/api/client";
import type {
  Activity,
  ActivityPayload,
  DiarySummary,
  HealthPayload,
  HealthRecord,
  SheddingClosePayload,
  SheddingPayload,
  SheddingRecord,
} from "@/types/diary";

// ── Activities ──
export function getDiary(petId: string, limit = 50, offset = 0): Promise<Activity[]> {
  return apiFetch<Activity[]>(
    `/v1/pets/${petId}/diary?limit=${limit}&offset=${offset}`,
  );
}

export function addActivity(petId: string, body: ActivityPayload): Promise<Activity> {
  return apiFetch<Activity>(`/v1/pets/${petId}/diary`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteActivity(petId: string, activityId: string): Promise<unknown> {
  return apiFetch(`/v1/pets/${petId}/diary/${activityId}`, { method: "DELETE" });
}

export function getDiarySummary(petId: string): Promise<DiarySummary> {
  return apiFetch<DiarySummary>(`/v1/pets/${petId}/diary/summary`);
}

// ── Health records ──
export function getHealth(petId: string): Promise<HealthRecord[]> {
  return apiFetch<HealthRecord[]>(`/v1/pets/${petId}/health`);
}

export function addHealth(petId: string, body: HealthPayload): Promise<HealthRecord> {
  return apiFetch<HealthRecord>(`/v1/pets/${petId}/health`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateHealth(
  petId: string,
  recordId: string,
  body: Partial<HealthPayload>,
): Promise<HealthRecord> {
  return apiFetch<HealthRecord>(`/v1/pets/${petId}/health/${recordId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteHealth(petId: string, recordId: string): Promise<unknown> {
  return apiFetch(`/v1/pets/${petId}/health/${recordId}`, { method: "DELETE" });
}

// ── Shedding ──
export function getShedding(petId: string): Promise<SheddingRecord[]> {
  return apiFetch<SheddingRecord[]>(`/v1/pets/${petId}/shedding`);
}

export function addShedding(petId: string, body: SheddingPayload): Promise<SheddingRecord> {
  return apiFetch<SheddingRecord>(`/v1/pets/${petId}/shedding`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function closeShedding(
  petId: string,
  sheddingId: string,
  body: SheddingClosePayload,
): Promise<SheddingRecord> {
  return apiFetch<SheddingRecord>(`/v1/pets/${petId}/shedding/${sheddingId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
