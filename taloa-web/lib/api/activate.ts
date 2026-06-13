const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Upload da foto do pet (multipart). Retorna a URL publica.
export async function uploadPetPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/v1/uploads/pet-photo`, {
    method: "POST",
    body: formData, // sem Content-Type: o browser define o boundary
  });
  if (!res.ok) {
    let detail = "Photo upload failed.";
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* sem corpo */
    }
    throw new Error(detail);
  }
  return (await res.json()).url as string;
}

export interface ActivatePayload {
  owner: {
    email: string;
    password: string;
    name: string;
    phone: string;
    emergency_phone?: string;
    gdpr_consent: boolean;
  };
  pet: {
    name: string;
    species: string;
    photo_url?: string;
  };
}

// Ativa a tag (cria dono + pet). Endpoint publico (usuario ainda sem sessao).
export async function activateTag(tagCode: string, payload: ActivatePayload) {
  const res = await fetch(`${API_URL}/v1/auth/activate/${encodeURIComponent(tagCode)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = "Activation failed.";
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* sem corpo */
    }
    throw new Error(detail);
  }
  return res.json();
}
