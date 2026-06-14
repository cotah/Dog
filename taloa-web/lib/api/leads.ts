const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Servicos oferecidos no formulario publico (valores batem com o backend).
export const SERVICE_OPTIONS = [
  { type: "dog_walking", label: "Dog Walking" },
  { type: "grooming", label: "Grooming" },
  { type: "training", label: "Training" },
  { type: "daycare", label: "Daycare" },
] as const;

export type ServiceType = (typeof SERVICE_OPTIONS)[number]["type"];

export interface PublicLeadPayload {
  tag_code: string;
  service_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  message?: string;
}

export async function createPublicLead(
  payload: PublicLeadPayload,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/v1/leads/public`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = "Could not send your request.";
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* sem corpo */
    }
    throw new Error(detail);
  }
  return res.json();
}
