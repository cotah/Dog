import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import type { VetPayload } from "@/types/admin";
import type { ProviderPayload } from "@/types/directory";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

// Upload de logo/foto de provider (FormData + auth manual; apiFetch forca JSON).
export async function uploadProviderImage(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/v1/admin/directory/upload`, {
    method: "POST",
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
    body: fd,
  });
  if (!res.ok) {
    let detail = "Upload failed";
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* sem corpo */
    }
    throw new Error(detail);
  }
  return ((await res.json()) as { url: string }).url;
}
