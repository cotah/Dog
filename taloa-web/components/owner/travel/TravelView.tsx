"use client";

import { Car, Plane, Plus, Ship, TrainFront } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { getTrip, getTrips } from "@/lib/api/travel";
import type { TripDetail, TripSummary } from "@/types/travel";

import { NewTripModal } from "./NewTripModal";
import { TripChecklist } from "./TripChecklist";

const TYPE_ICONS = {
  car: Car,
  plane: Plane,
  ferry: Ship,
  train: TrainFront,
} as const;

export function TravelView({ petId }: { petId: string }) {
  const t = useTranslations("travelChecklist");
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [selected, setSelected] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await getTrips(petId));
      setLocked(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) setLocked(true);
      else setTrips([]);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  // Free plan: API devolve 402 -> CTA de upgrade
  if (locked) {
    return (
      <div className="rounded-card border border-dashed border-taloa-primary/30 bg-taloa-primary/5 px-6 py-10 text-center">
        <h3 className="mb-1 font-bold text-slate-800">{t("upgradeTitle")}</h3>
        <p className="mb-4 text-sm text-slate-500">{t("upgradeBody")}</p>
        <Link
          href="/pricing"
          className="inline-block rounded-input bg-taloa-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {t("upgradeCta")}
        </Link>
      </div>
    );
  }

  if (selected) {
    return (
      <TripChecklist
        trip={selected}
        onBack={() => {
          setSelected(null);
          load();
        }}
        onDeleted={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">{t("title")}</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-input bg-taloa-primary px-3 py-1.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> {t("newTrip")}
        </button>
      </div>

      {trips.length === 0 ? (
        <p className="rounded-card border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {trips.map((trip) => {
            const Icon = TYPE_ICONS[trip.travel_type];
            const pct = trip.total_count
              ? Math.round((trip.checked_count / trip.total_count) * 100)
              : 0;
            return (
              <li key={trip.id}>
                <button
                  onClick={async () => setSelected(await getTrip(trip.id))}
                  className="w-full rounded-card border border-slate-200 px-4 py-3 text-left hover:border-taloa-primary/40"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-taloa-primary" />
                    <span className="font-semibold text-slate-800">
                      {trip.title || trip.destination || t(`types.${trip.travel_type}`)}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {trip.travel_date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded bg-slate-100">
                      <div
                        className="h-1.5 rounded bg-taloa-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {t("progress", {
                        checked: trip.checked_count,
                        total: trip.total_count,
                      })}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <NewTripModal
          petId={petId}
          onClose={() => setAdding(false)}
          onCreated={(trip) => {
            setAdding(false);
            setSelected(trip);
          }}
        />
      )}
    </div>
  );
}
