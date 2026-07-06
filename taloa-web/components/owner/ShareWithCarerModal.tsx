"use client";

import { Check, Copy, Link2, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { createCareShare, listCareShares, revokeCareShare } from "@/lib/api/care";
import { Spinner } from "@/components/ui/Spinner";
import type { CareDuration, CareShare } from "@/types/care";

const DURATIONS: { value: CareDuration; key: string }[] = [
  { value: "3d", key: "dur3d" },
  { value: "1w", key: "dur1w" },
  { value: "2w", key: "dur2w" },
  { value: "1mo", key: "dur1mo" },
];

export function ShareWithCarerModal({
  petId,
  petName,
  onClose,
}: {
  petId: string;
  petName: string;
  onClose: () => void;
}) {
  const t = useTranslations("care");
  const locale = useLocale();
  const [duration, setDuration] = useState<CareDuration>("1w");
  const [showDiary, setShowDiary] = useState(false);
  const [shares, setShares] = useState<CareShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCareShares(petId)
      .then(setShares)
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [petId, t]);

  async function onCreate() {
    setCreating(true);
    setError(null);
    try {
      const share = await createCareShare(petId, duration, showDiary);
      setShares((prev) => [share, ...prev]);
    } catch {
      setError(t("createError"));
    } finally {
      setCreating(false);
    }
  }

  async function onCopy(share: CareShare) {
    if (!share.care_url) return;
    try {
      await navigator.clipboard.writeText(share.care_url);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard indisponivel */
    }
  }

  async function onRevoke(id: string) {
    setShares((prev) => prev.filter((s) => s.id !== id));
    try {
      await revokeCareShare(id);
    } catch {
      setError(t("revokeError"));
    }
  }

  function fmt(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-card bg-white p-5 shadow-lg sm:rounded-card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {t("shareTitle", { name: petName })}
          </h2>
          <button onClick={onClose} aria-label={t("close")} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">{t("shareIntro", { name: petName })}</p>

        {/* Duracao */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={`h-10 rounded-input border text-sm font-medium ${
                duration === d.value
                  ? "border-taloa-primary bg-taloa-primary/10 text-taloa-primary"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t(d.key)}
            </button>
          ))}
        </div>

        {/* Toggle: partilhar o diario (read-only) com o carer. Default off. */}
        <button
          type="button"
          onClick={() => setShowDiary((v) => !v)}
          className="mt-3 flex w-full items-center gap-3 rounded-input border border-slate-200 p-3 text-left"
        >
          <span
            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
              showDiary ? "bg-taloa-primary" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                showDiary ? "translate-x-[1.125rem]" : "translate-x-0.5"
              }`}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-700">
              {t("shareDiary")}
            </span>
            <span className="block text-xs text-slate-400">{t("shareDiaryHint")}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
        >
          {creating ? <Spinner className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {creating ? t("creating") : t("createLink")}
        </button>

        {error && <p className="mt-2 text-sm text-taloa-alert">{error}</p>}

        {/* Links ativos */}
        <h3 className="mt-5 text-sm font-semibold text-slate-700">{t("activeLinks")}</h3>
        {loading ? (
          <div className="mt-3 flex justify-center">
            <Spinner />
          </div>
        ) : shares.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">{t("noLinks")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {shares.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-input border border-slate-200 p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-500">{s.care_url}</p>
                  <p className="text-xs text-slate-400">
                    {t("validUntil", { date: fmt(s.expires_at) })}
                    {s.show_diary && (
                      <span className="ml-1.5 rounded-badge bg-taloa-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-taloa-primary">
                        {t("diaryOn")}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => onCopy(s)}
                  aria-label={t("copy")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  {copiedId === s.id ? (
                    <Check className="h-4 w-4 text-taloa-secondary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => onRevoke(s.id)}
                  aria-label={t("revoke")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-taloa-alert/40 text-taloa-alert hover:bg-taloa-alert/5"
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
