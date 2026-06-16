"use client";

import { Check, ImagePlus, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { createFoundReport, uploadFoundPhoto } from "@/lib/api/found";
import { track } from "@/lib/analytics";
import { Spinner } from "@/components/ui/Spinner";

const inputClass =
  "w-full rounded-input border border-slate-300 px-3 py-2.5 outline-none focus:border-taloa-primary";

export function FoundReportForm({
  tagCode,
  onSuccess,
}: {
  tagCode: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("found");
  const tc = useTranslations("common");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  // Pede permissao de localizacao (o browser mostra o prompt nativo)
  function onShareLocation() {
    setLocError(null);
    if (!("geolocation" in navigator)) {
      setLocError(t("locationUnavailable"));
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => {
        setLocError(t("locationError"));
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadFoundPhoto(photoFile);
      }
      await createFoundReport({
        tag_code: tagCode,
        found_area: area || undefined,
        notes: notes || undefined,
        finder_phone: phone || undefined,
        photo_url: photoUrl,
        location_lat: coords?.lat,
        location_lng: coords?.lng,
        location_granted: coords !== null,
      });
      track("found_pet_submitted", {
        tag_code: tagCode,
        has_photo: photoFile !== null,
        location_granted: coords !== null,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("somethingWentWrong"));
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-card bg-white p-5 shadow-sm"
    >
      <h3 className="font-semibold text-slate-800">{t("formTitle")}</h3>

      {/* Foto opcional */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-24 items-center justify-center overflow-hidden rounded-input border-2 border-dashed border-slate-300 bg-taloa-bg text-slate-400 hover:border-taloa-primary"
      >
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="Found pet" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm">
            <ImagePlus className="h-5 w-5" />
            {t("addPhoto")}
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPickPhoto}
        className="hidden"
      />

      <input
        className={inputClass}
        placeholder={t("areaPlaceholder")}
        value={area}
        onChange={(e) => setArea(e.target.value)}
      />
      <textarea
        className={`${inputClass} min-h-20 resize-none`}
        placeholder={t("notesPlaceholder")}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <input
        className={inputClass}
        type="tel"
        placeholder={t("phonePlaceholder")}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {/* Share location — permissao explicita com texto claro ANTES de capturar */}
      <div className="rounded-input border border-slate-200 p-3">
        <p className="text-sm text-slate-600">{t("shareLocationHelp")}</p>
        {coords ? (
          <p className="mt-2 flex items-center gap-1 text-sm font-medium text-taloa-primary">
            <Check className="h-4 w-4" /> {t("locationShared")}
          </p>
        ) : (
          <button
            type="button"
            onClick={onShareLocation}
            disabled={locLoading}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-input border border-taloa-primary font-medium text-taloa-primary hover:bg-taloa-primary/5 disabled:opacity-60"
          >
            {locLoading ? <Spinner className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            {locLoading ? t("gettingLocation") : t("shareMyLocation")}
          </button>
        )}
        {locError && <p className="mt-2 text-sm text-taloa-alert">{locError}</p>}
      </div>

      {error && <p className="text-sm text-taloa-alert">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
      >
        {loading ? (
          <>
            <Spinner /> {t("sending")}
          </>
        ) : (
          t("notifyOwner")
        )}
      </button>
    </form>
  );
}
