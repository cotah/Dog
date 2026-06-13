import { apiFetch } from "@/lib/api/client";
import type { PetUpdatePayload } from "@/types/owner";

export function markLost(petId: string) {
  return apiFetch(`/v1/pets/${petId}/lost`, { method: "POST" });
}

export function markFound(petId: string) {
  return apiFetch(`/v1/pets/${petId}/found`, { method: "POST" });
}

export function updatePet(petId: string, data: PetUpdatePayload) {
  return apiFetch(`/v1/pets/${petId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function requestService(
  serviceType: string,
  petId?: string,
  tagCode?: string,
) {
  return apiFetch(`/v1/leads`, {
    method: "POST",
    body: JSON.stringify({
      service_type: serviceType,
      pet_id: petId,
      tag_code: tagCode,
    }),
  });
}
