import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function generateTags(quantity: number, startNumber: number) {
  return apiFetch<{ tag_codes: string[] }>(`/v1/admin/tags/generate`, {
    method: "POST",
    body: JSON.stringify({ quantity, start_number: startNumber }),
  });
}

const FILE_NAMES: Record<string, string> = {
  png: "taloa-qr-codes.zip",
  pdf: "taloa-labels.pdf",
  csv: "taloa-tags.csv",
};

// Baixa o export (zip/pdf/csv) como blob e dispara o download no browser.
export async function downloadExport(
  format: "png" | "pdf" | "csv",
  codes: string[],
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/v1/admin/tags/export/${format}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({ tag_codes: codes }),
  });
  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = FILE_NAMES[format];
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
