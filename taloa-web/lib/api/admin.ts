import { apiFetch } from "@/lib/api/client";
import type { VetPayload } from "@/types/admin";

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
