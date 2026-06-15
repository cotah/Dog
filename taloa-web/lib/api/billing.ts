import type { Plan } from "@/types/billing";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Lista publica dos planos ativos (alimenta a pagina /pricing). Server-side.
export async function getPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_URL}/v1/plans`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load plans");
  return res.json();
}
