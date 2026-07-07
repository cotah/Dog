"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { createTrip } from "@/lib/api/travel";
import type { TravelType, TripDetail, TripScope } from "@/types/travel";

const TYPES: TravelType[] = ["car", "plane", "ferry", "train"];
const SCOPES: TripScope[] = ["domestic", "international"];

export function NewTripModal({
  petId,
  onClose,
  onCreated,
}: {
  petId: string;
  onClose: () => void;
  onCreated: (trip: TripDetail) => void;
}) {
  const t = useTranslations("travelChecklist");
  const [title, setTitle] = useState("");
  const [travelType, setTravelType] = useState<TravelType>("car");
  const [scope, setScope] = useState<TripScope>("domestic");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!travelDate) return;
    setSaving(true);
    setError(null);
    try {
      const trip = await createTrip(petId, {
        title: title.trim() || undefined,
        travel_type: travelType,
        scope,
        destination: destination.trim() || undefined,
        travel_date: travelDate,
      });
      onCreated(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-card bg-white p-5 shadow-xl"
      >
        <h3 className="mb-4 text-lg font-bold text-slate-800">{t("newTrip")}</h3>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("tripTitle")}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder={t("titlePlaceholder")}
          className="mb-3 w-full rounded-input border border-slate-200 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("travelType")}
        </label>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {TYPES.map((ty) => (
            <button
              key={ty}
              type="button"
              onClick={() => setTravelType(ty)}
              className={`rounded-input border px-2 py-2 text-sm ${
                travelType === ty
                  ? "border-taloa-primary bg-taloa-primary/5 font-semibold text-taloa-primary"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {t(`types.${ty}`)}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("scope")}
        </label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {SCOPES.map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => setScope(sc)}
              className={`rounded-input border px-2 py-2 text-sm ${
                scope === sc
                  ? "border-taloa-primary bg-taloa-primary/5 font-semibold text-taloa-primary"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {t(`scopes.${sc}`)}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("destination")}
        </label>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          maxLength={200}
          placeholder={t("destinationPlaceholder")}
          className="mb-3 w-full rounded-input border border-slate-200 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600">
          {t("travelDate")}
        </label>
        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
          required
          className="mb-4 w-full rounded-input border border-slate-200 px-3 py-2 text-sm"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-input px-4 py-2 text-sm text-slate-500"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || !travelDate}
            className="rounded-input bg-taloa-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("creating") : t("create")}
          </button>
        </div>
      </form>
    </div>
  );
}
