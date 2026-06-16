// Chamadas publicas ao Partners Directory (sem auth).
import type { CategoryCount, PublicProvider } from "@/types/directory";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type DirectoryFilters = {
  category?: string;
  area?: string;
  species?: string;
  emergency_24h?: boolean;
  is_featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function getDirectory(
  filters: DirectoryFilters = {},
): Promise<PublicProvider[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const res = await fetch(`${API_URL}/v1/directory?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load directory");
  return res.json();
}

export async function getDirectoryCategories(): Promise<CategoryCount[]> {
  const res = await fetch(`${API_URL}/v1/directory/categories`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}
