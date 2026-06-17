"use client";

import { Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { adminDeleteReview, adminListReviews } from "@/lib/api/reviews";
import { Spinner } from "@/components/ui/Spinner";
import type { Review } from "@/types/review";

// Painel admin para moderar (apagar) reviews de um provider.
export function AdminReviewsModal({
  providerId,
  providerName,
  onClose,
}: {
  providerId: string;
  providerName: string;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    adminListReviews(providerId).then(setReviews).catch(() => setReviews([]));
  }, [providerId]);

  async function onDelete(id: string) {
    setReviews((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    try {
      await adminDeleteReview(id);
    } catch {
      /* ignora — recarrega no proximo open */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-card bg-white p-5 shadow-lg sm:rounded-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Reviews — {providerName}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {reviews === null ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : reviews.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No reviews.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-2 rounded-input border border-slate-200 p-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${
                          n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                    {r.reviewer_name && (
                      <span className="ml-1 text-xs font-medium text-slate-500">
                        {r.reviewer_name}
                      </span>
                    )}
                  </div>
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                </div>
                <button
                  onClick={() => onDelete(r.id)}
                  aria-label="Delete review"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-input border border-taloa-alert/40 text-taloa-alert hover:bg-taloa-alert/5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
