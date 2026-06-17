"use client";

import { AlertTriangle, Phone, Stethoscope } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { CareProfile } from "@/types/care";

function tel(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

// Bloco de texto (so renderiza se houver valor).
function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm text-slate-700">{value}</p>
    </div>
  );
}

// Vista do carer (sitter/hotel/vet) — perfil completo. Distinta do /t publico.
export function CarerView({ care }: { care: CareProfile }) {
  const t = useTranslations("care");
  const locale = useLocale();

  const basics = [
    care.species ? care.species.charAt(0).toUpperCase() + care.species.slice(1) : null,
    care.breed_or_morph,
    care.colour,
    care.sex ? care.sex.charAt(0).toUpperCase() + care.sex.slice(1) : null,
    care.age_years != null ? `${care.age_years} ${t("years")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const validUntil = care.expires_at
    ? new Date(care.expires_at).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const habitat =
    care.habitat_temp_min != null ||
    care.habitat_temp_max != null ||
    care.humidity_notes ||
    care.lighting_notes ||
    care.handling_notes;

  const tempRange =
    care.habitat_temp_min != null || care.habitat_temp_max != null
      ? `${care.habitat_temp_min ?? "?"}–${care.habitat_temp_max ?? "?"} °C`
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      {/* Banner de validade */}
      {validUntil && (
        <div className="rounded-card bg-taloa-primary/10 px-4 py-2 text-center text-xs font-medium text-taloa-primary">
          {t("carerBanner", { name: care.pet_name })} · {t("validUntil", { date: validUntil })}
        </div>
      )}

      {/* Cabecalho: foto + basics */}
      <div className="flex flex-col items-center gap-3 rounded-card bg-white p-5 text-center shadow-sm">
        {care.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={care.photo_url}
            alt={care.pet_name}
            className="h-28 w-28 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{care.pet_name}</h1>
          {basics && <p className="mt-1 text-sm text-slate-500">{basics}</p>}
        </div>
      </div>

      {/* Telefone do dono — sempre visivel e em destaque */}
      {care.owner_phone && (
        <a
          href={tel(care.owner_phone)}
          className="flex h-14 items-center justify-center gap-2 rounded-input bg-taloa-primary text-lg font-semibold text-white hover:bg-taloa-secondary"
        >
          <Phone className="h-5 w-5" /> {t("callOwner")}
        </a>
      )}

      {/* Cuidados */}
      <div className="flex flex-col gap-3 rounded-card bg-white p-5 shadow-sm">
        <Field label={t("medication")} value={care.medication} />
        <Field label={t("allergies")} value={care.allergies} />
        <Field label={t("behaviour")} value={care.behaviour} />
        <Field label={t("likes")} value={care.likes} />
        <Field label={t("dislikes")} value={care.dislikes} />
        <Field label={t("feeding")} value={care.feeding_schedule} />
        <Field label={t("emergencyNotes")} value={care.emergency_notes} />
        <Field label={t("publicNotes")} value={care.public_notes} />
        <Field label={t("privateNotes")} value={care.private_notes} />
      </div>

      {/* Habitat (exoticos) */}
      {habitat && (
        <div className="flex flex-col gap-3 rounded-card bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-taloa-primary">{t("habitat")}</h2>
          <Field label={t("temperature")} value={tempRange} />
          <Field label={t("humidity")} value={care.humidity_notes} />
          <Field label={t("lighting")} value={care.lighting_notes} />
          <Field label={t("handling")} value={care.handling_notes} />
        </div>
      )}

      {/* Vet */}
      {(care.vet_name || care.vet_phone) && (
        <div className="flex flex-col gap-2 rounded-card bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-taloa-primary">{t("vet")}</h2>
          {care.vet_name && <p className="text-sm text-slate-700">{care.vet_name}</p>}
          {care.vet_phone && (
            <a
              href={tel(care.vet_phone)}
              className="flex h-11 items-center justify-center gap-2 rounded-input border border-taloa-primary text-sm font-semibold text-taloa-primary hover:bg-taloa-primary/5"
            >
              <Phone className="h-4 w-4" /> {care.vet_phone}
            </a>
          )}
        </div>
      )}

      {/* Botao de emergencia */}
      <Link
        href={{
          pathname: "/directory",
          query: { category: "vet_emergency", emergency_24h: "true" },
        }}
        className="flex h-14 items-center justify-center gap-2 rounded-input border-2 border-taloa-alert text-lg font-semibold text-taloa-alert hover:bg-taloa-alert/5"
      >
        <Stethoscope className="h-5 w-5" /> {t("emergencyBtn")}
      </Link>

      <div className="flex items-start gap-2 px-1 text-xs text-slate-400">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>{t("disclaimer")}</p>
      </div>

      <footer className="mt-auto py-4 text-center text-xs text-slate-400">
        {t("poweredBy")}
      </footer>
    </main>
  );
}
