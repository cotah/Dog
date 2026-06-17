// Reviews de providers — leitura publica + criar (auth) + apagar (admin).
import { apiFetch } from "@/lib/api/client";
import type { Review, ReviewPayload } from "@/types/review";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getReviews(providerId: string): Promise<Review[]> {
  const res = await fetch(`${API_URL}/v1/directory/${providerId}/reviews`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export function submitReview(
  providerId: string,
  payload: ReviewPayload,
): Promise<Review> {
  return apiFetch<Review>(`/v1/directory/${providerId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Admin
export function adminListReviews(providerId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/v1/admin/directory/${providerId}/reviews`);
}

export function adminDeleteReview(reviewId: string): Promise<unknown> {
  return apiFetch(`/v1/admin/directory/reviews/${reviewId}`, { method: "DELETE" });
}
