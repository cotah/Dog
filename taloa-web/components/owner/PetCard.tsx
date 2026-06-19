"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BookOpen,
  CreditCard,
  ExternalLink,
  MapPin,
  PawPrint,
  Pencil,
  Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { ShareWithCarerModal } from "@/components/owner/ShareWithCarerModal";
import { TagStatusBadge } from "@/components/public/TagStatusBadge";
import { track } from "@/lib/analytics";
import { markFound, markLost } from "@/lib/api/owner";
import type { PetSummary } from "@/types/owner";

import { EditPetModal } from "./EditPetModal";

export function PetCard({ pet }: { pet: PetSummary }) {
  const router = useRouter();
  const td = useTranslations("diary");
  const [confirmingLost, setConfirmingLost] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLost = pet.tag?.status === "lost";

  const alert = pet.health_alert;
  const alertText = alert
    ? alert.days_until < 0
      ? td("alertOverdue", { title: alert.title })
      : alert.days_until === 0
        ? td("alertDueToday", { title: alert.title })
        : td("alertDueIn", { title: alert.title, count: alert.days_until })
    : null;
  const alertRed = alert ? alert.days_until < 0 : false;

  async function doLost() {
    setBusy(true);
    setError(null);
    try {
      await markLost(pet.id);
      track("lost_mode_activated", { species: pet.species });
      setConfirmingLost(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function doFound() {
    setBusy(true);
    setError(null);
    try {
      await markFound(pet.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const lastScanWhen = pet.last_scan?.scanned_at
    ? formatDistanceToNow(new Date(pet.last_scan.scanned_at), { addSuffix: true })
    : null;
  const hasLoc =
    pet.last_scan?.location_granted &&
    pet.last_scan.location_lat != null &&
    pet.last_scan.location_lng != null;

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      {/* Cabecalho do card */}
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-input bg-taloa-primary/5">
          {pet.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={pet.name}
              width={64}
              height={64}
              className="h-16 w-16 object-cover"
            />
          ) : (
            <PawPrint className="h-7 w-7 text-taloa-primary/40" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-800">{pet.name}</h3>
            {pet.tag && <TagStatusBadge status={pet.tag.status} />}
          </div>
          <p className="text-sm capitalize text-slate-500">{pet.species}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {lastScanWhen ? `Last scan ${lastScanWhen}` : "No scans yet"}
            {hasLoc && (
              <>
                {" · "}
                <a
                  href={`https://www.google.com/maps?q=${pet.last_scan!.location_lat},${pet.last_scan!.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-taloa-info"
                >
                  <MapPin className="h-3 w-3" /> location
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {alertText && (
        <Link
          href={`/owner/pets/${pet.id}`}
          className={`mt-3 flex items-center gap-1.5 rounded-input px-3 py-2 text-xs font-medium ${
            alertRed
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <Bell className="h-3.5 w-3.5 shrink-0" />
          {alertText}
        </Link>
      )}

      {error && <p className="mt-2 text-sm text-taloa-alert">{error}</p>}

      {/* Acoes */}
      <div className="mt-4 flex flex-col gap-2">
        {isLost ? (
          <button
            onClick={doFound}
            disabled={busy}
            className="h-11 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
          >
            {busy ? "Updating…" : "Mark as Found"}
          </button>
        ) : confirmingLost ? (
          <div className="flex flex-col gap-2 rounded-input border border-taloa-alert/30 bg-taloa-alert/5 p-3">
            <p className="text-sm text-slate-700">
              Mark <strong>{pet.name}</strong> as lost? The public profile will show
              a LOST banner.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingLost(false)}
                className="h-10 flex-1 rounded-input border border-slate-300 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={doLost}
                disabled={busy}
                className="h-10 flex-1 rounded-input bg-taloa-alert text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "…" : "Yes, mark lost"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingLost(true)}
            disabled={!pet.tag}
            className="h-11 rounded-input bg-taloa-alert font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            Mark as Lost
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex h-11 items-center justify-center gap-1.5 rounded-input border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" /> Edit Pet
          </button>
          {pet.tag ? (
            <a
              href={`/t/${pet.tag.tag_code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-1.5 rounded-input border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" /> Public Profile
            </a>
          ) : (
            <span className="flex h-11 items-center justify-center rounded-input border border-slate-200 text-sm text-slate-300">
              No tag
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/owner/pets/${pet.id}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-input border border-taloa-primary text-sm font-medium text-taloa-primary hover:bg-taloa-primary/5"
          >
            <BookOpen className="h-4 w-4" /> {td("tabDiary")}
          </Link>
          {pet.tag ? (
            <Link
              href={`/owner/pets/${pet.id}/card?tag=${pet.tag.tag_code}`}
              className="flex h-11 items-center justify-center gap-1.5 rounded-input border border-taloa-primary text-sm font-medium text-taloa-primary hover:bg-taloa-primary/5"
            >
              <CreditCard className="h-4 w-4" /> Pet Card
            </Link>
          ) : (
            <span className="flex h-11 items-center justify-center rounded-input border border-slate-200 text-sm text-slate-300">
              No tag
            </span>
          )}
        </div>

        <button
          onClick={() => setSharing(true)}
          className="flex h-11 items-center justify-center gap-1.5 rounded-input border border-taloa-primary text-sm font-medium text-taloa-primary hover:bg-taloa-primary/5"
        >
          <Share2 className="h-4 w-4" /> Share with Carer
        </button>
      </div>

      {editing && (
        <EditPetModal
          pet={pet}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}

      {sharing && (
        <ShareWithCarerModal
          petId={pet.id}
          petName={pet.name}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
