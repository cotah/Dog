const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface FoundReportPayload {
  tag_code: string;
  found_area?: string;
  notes?: string;
  finder_phone?: string;
  photo_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_granted: boolean;
}

// Upload da foto do pet encontrado (publico — o finder nao esta logado).
// Vai para o bucket pet-photos na pasta found/.
export async function uploadFoundPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/v1/uploads/found-photo`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Could not upload the photo.");
  return ((await res.json()) as { url: string }).url;
}

export async function createFoundReport(
  payload: FoundReportPayload,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/v1/found-reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = "Could not send your report.";
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* sem corpo */
    }
    throw new Error(detail);
  }
  return res.json();
}
