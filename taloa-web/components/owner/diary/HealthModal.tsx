"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { addHealth, updateHealth } from "@/lib/api/diary";
import { HEALTH_RECORD_TYPES } from "@/lib/diary/species-templates";
import type { HealthPayload, HealthRecord } from "@/types/diary";

import { todayISODate } from "./shared";

export function HealthModal({
  petId,
  existing,
  onClose,
  onSaved,
}: {
  petId: string;
  existing?: HealthRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("diary");
  const [recordType, setRecordType] = useState(existing?.record_type ?? "vaccine");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.date ?? todayISODate());
  const [nextDue, setNextDue] = useState(existing?.next_due_date ?? "");
  const [vet, setVet] = useState(existing?.vet_name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    const body: HealthPayload = {
      record_type: recordType,
      title: title.trim(),
      date,
      next_due_date: nextDue || null,
      vet_name: vet || null,
      description: description || null,
    };
    try {
      if (existing) await updateHealth(petId, existing.id, body);
      else await addHealth(petId, body);
      onSaved();
      onClose();
    } catch {
      setError(t("saveError"));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-card bg-white p-5 shadow-lg sm:rounded-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t("addHealth")}</h2>
          <button onClick={onClose} aria-label={t("cancel")} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">{t("selectType")}</span>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className={inputCls}
            >
              {HEALTH_RECORD_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {t(`healthTypes.${ty}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">{t("fieldTitle")}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className={inputCls}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">{t("fieldDate")}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">
                {t("fieldNextDue")}
              </span>
              <input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">{t("fieldVet")}</span>
            <input
              value={vet}
              onChange={(e) => setVet(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">
              {t("fieldDescription")}
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              className={`${inputCls} min-h-16 resize-none`}
            />
          </label>

          {error && <p className="text-sm text-taloa-alert">{error}</p>}

          <button
            onClick={submit}
            disabled={busy || !title.trim()}
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
