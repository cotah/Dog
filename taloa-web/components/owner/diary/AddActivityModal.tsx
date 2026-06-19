"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { addActivity } from "@/lib/api/diary";
import { ACTIVITY_META, templateFor } from "@/lib/diary/species-templates";
import type { ActivityPayload } from "@/types/diary";

import { ActivityIcon } from "./shared";

export function AddActivityModal({
  petId,
  species,
  onClose,
  onSaved,
}: {
  petId: string;
  species: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("diary");
  const types = templateFor(species).activities;

  const [type, setType] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [walker, setWalker] = useState("");
  const [weight, setWeight] = useState("");
  const [feeding, setFeeding] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = type ? ACTIVITY_META[type]?.fields ?? ["notes"] : [];

  async function submit() {
    if (!type) return;
    setBusy(true);
    setError(null);
    const body: ActivityPayload = { activity_type: type };
    if (fields.includes("duration") && duration)
      body.duration_minutes = parseInt(duration, 10);
    if (fields.includes("distance") && distance)
      body.distance_meters = parseInt(distance, 10);
    if (fields.includes("walker") && walker) body.walker_name = walker;
    // weight, feeding e notes partilham a coluna notes (so um por tipo)
    if (fields.includes("weight") && weight) body.notes = weight.replace(",", ".");
    else if (fields.includes("feeding") && feeding) body.notes = feeding;
    else if (fields.includes("notes") && notes) body.notes = notes;

    try {
      await addActivity(petId, body);
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
          <h2 className="text-lg font-bold text-slate-800">{t("addActivity")}</h2>
          <button onClick={onClose} aria-label={t("cancel")} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!type ? (
          <div className="grid grid-cols-3 gap-2">
            {types.map((ty) => (
              <button
                key={ty}
                onClick={() => setType(ty)}
                className="flex flex-col items-center gap-1.5 rounded-input border border-slate-200 p-3 text-center hover:border-taloa-primary hover:bg-taloa-primary/5"
              >
                <span className="text-taloa-primary">
                  <ActivityIcon type={ty} className="h-5 w-5" />
                </span>
                <span className="text-xs text-slate-600">{t(`types.${ty}`)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-input bg-taloa-primary/5 px-3 py-2">
              <span className="text-taloa-primary">
                <ActivityIcon type={type} className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-700">
                {t(`types.${type}`)}
              </span>
              <button
                onClick={() => setType(null)}
                className="ml-auto text-xs text-taloa-primary underline"
              >
                {t("selectType")}
              </button>
            </div>

            {fields.includes("duration") && (
              <Field label={t("fieldDuration")}>
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}
            {fields.includes("distance") && (
              <Field label={t("fieldDistance")}>
                <input
                  type="number"
                  min={0}
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}
            {fields.includes("walker") && (
              <Field label={t("fieldWalker")}>
                <input
                  value={walker}
                  onChange={(e) => setWalker(e.target.value)}
                  placeholder={t("walkerPlaceholder")}
                  className={inputCls}
                />
              </Field>
            )}
            {fields.includes("weight") && (
              <Field label={t("fieldWeight")}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.0"
                  className={inputCls}
                />
              </Field>
            )}
            {fields.includes("feeding") && (
              <Field label={t("fieldFeeding")}>
                <input
                  value={feeding}
                  onChange={(e) => setFeeding(e.target.value)}
                  placeholder={t("feedingPlaceholder")}
                  className={inputCls}
                />
              </Field>
            )}
            {fields.includes("notes") && (
              <Field label={t("fieldNotes")}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  maxLength={2000}
                  className={`${inputCls} min-h-20 resize-none`}
                />
              </Field>
            )}

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
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-input border border-slate-300 px-3 py-2 text-sm outline-none focus:border-taloa-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
