import { apiFetch } from "@/lib/api/client";
import type { VetPayload } from "@/types/admin";
import type { ProviderPayload } from "@/types/directory";

export function updateLeadStatus(leadId: string, status: string) {
  return apiFetch(`/v1/admin/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function createVet(data: VetPayload) {
  return apiFetch(`/v1/admin/vets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateVet(vetId: string, data: Partial<VetPayload>) {
  return apiFetch(`/v1/admin/vets/${vetId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateUserRole(userId: string, role: string) {
  return apiFetch(`/v1/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateTagType(tagCode: string, tagType: string) {
  return apiFetch(`/v1/admin/tags/${tagCode}`, {
    method: "PATCH",
    body: JSON.stringify({ tag_type: tagType }),
  });
}

// ── Partners Directory (Etapa 23) ──
export function createProvider(data: ProviderPayload) {
  return apiFetch(`/v1/admin/directory`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProvider(id: string, data: Partial<ProviderPayload>) {
  return apiFetch(`/v1/admin/directory/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProvider(id: string) {
  return apiFetch(`/v1/admin/directory/${id}`, { method: "DELETE" });
}
