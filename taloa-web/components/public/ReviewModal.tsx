"use client";

import { Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { hasActiveSession } from "@/lib/api/ai";
import { submitReview } from "@/lib/api/reviews";
import { Spinner } from "@/components/ui/Spinner";

export function ReviewModal({
  providerId,
  providerName,
  onClose,
  onSubmitted,
}: {
  providerId: string;
  providerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const t = useTranslations("directory");
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasActiveSession().then(setLoggedIn);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;
    setBusy(true);
    setError(null);
    try {
      await submitReview(providerId, { rating, comment: comment || null });
      onSubmitted();
      router.refresh();
      onClose();
    } catch {
      setError(t("reviewError"));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-card bg-white p-5 shadow-lg sm:rounded-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {t("reviewTitle", { name: providerName })}
          </h2>
          <button onClick={onClose} aria-label={t("close_modal")} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loggedIn === false ? (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-600">{t("loginToReview")}</p>
            <Link
              href={{ pathname: "/login", query: { redirect: "/directory" } }}
              className="mt-3 inline-flex h-11 items-center justify-center rounded-input bg-taloa-primary px-5 font-semibold text-white hover:bg-taloa-secondary"
            >
              {t("login")}
            </Link>
          </div>
        ) : loggedIn === null ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-600">{t("yourRating")}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${n}`}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        n <= (hover || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("commentPlaceholder")}
              maxLength={1000}
              className="min-h-20 w-full resize-none rounded-input border border-slate-300 px-3 py-2 text-sm outline-none focus:border-taloa-primary"
            />
            {error && <p className="text-sm text-taloa-alert">{error}</p>}
            <button
              type="submit"
              disabled={busy || rating < 1}
              className="flex h-12 items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
            >
              {busy ? <Spinner className="h-4 w-4" /> : null}
              {busy ? t("submitting") : t("submitReview")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
