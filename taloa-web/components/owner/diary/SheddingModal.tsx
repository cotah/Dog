"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { addShedding, closeShedding } from "@/lib/api/diary";
import type { SheddingConfig } from "@/lib/diary/species-templates";
import type { SheddingRecord } from "@/types/diary";

import { todayISODate } from "./shared";

export function SheddingModal({
  petId,
  config,
  existing,
  onClose,
  onSaved,
}: {
  petId: string;
  config: SheddingConfig;
  existing?: SheddingRecord; // presente = fechar periodo em curso
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("diary");
  const closing = !!existing;
  const usesIntensity = config.field === "intensity";

  const [startedAt, setStartedAt] = useState(todayISODate());
  const [endedAt, setEndedAt] = useState(todayISODate());
  const [intensity, setIntensity] = useState(existing?.intensity ?? "medium");
  const [wasComplete, setWasComplete] = useState<boolean>(
    existing?.was_complete ?? true,
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (closing) {
        await closeShedding(petId, existing!.id, {
          ended_at: endedAt,
          intensity: usesIntensity ? intensity : null,
          was_complete: usesIntensity ? null : wasComplete,
          notes: notes || null,
        });
      } else {
        await addShedding(petId, {
          shed_type: config.shedType,
          started_at: startedAt,
          intensity: usesIntensity ? intensity : null,
          was_complete: usesIntensity ? null : wasComplete,
          notes: notes || null,
        });
      }
      onSaved();
      onClose();
    } catch {
      setError(t("saveError"));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-card bg-white p-5 shadow-lg sm:rounded-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {closing ? t("closePeriod") : t("addShedding")}
          </h2>
          <button onClick={onClose} aria-label={t("cancel")} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">
              {closing ? t("periodEnd") : t("periodStart")}
            </span>
            <input
              type="date"
              value={closing ? endedAt : startedAt}
              onChange={(e) =>
                closing ? setEndedAt(e.target.value) : setStartedAt(e.target.value)
              }
              className={inputCls}
            />
          </label>

          {usesIntensity ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">
                {t("intensity")}
              </span>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className={inputCls}
              >
                <option value="light">{t("intensityLight")}</option>
                <option value="medium">{t("intensityMedium")}</option>
                <option value="heavy">{t("intensityHeavy")}</option>
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">
                {t("completeQ")}
              </span>
              <select
                value={wasComplete ? "yes" : "no"}
                onChange={(e) => setWasComplete(e.target.value === "yes")}
                className={inputCls}
              >
                <option value="yes">{t("complete")}</option>
                <option value="no">{t("partial")}</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">{t("fieldNotes")}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              maxLength={2000}
              className={`${inputCls} min-h-16 resize-none`}
            />
          </label>

          {error && <p className="text-sm text-taloa-alert">{error}</p>}

          <button
            onClick={submit}
            disabled={busy}
            className="flex h-12 items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
          >
            {busy ? <Spinner className="h-4 w-4" /> : null}
            {busy ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-input border border-slate-300 px-3 py-2 text-sm outline-none focus:border-taloa-primary";
