"use client";

import { useLocale, useTranslations } from "next-intl";

import type { PetCard } from "@/types/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Carteira digital do pet. Mesmo layout do PDF (header TALOA, foto, dados, QR).
// Foto so aparece se existir; telefone do dono so vem preenchido se show_phone.
export function PetIdCard({ card }: { card: PetCard }) {
  const t = useTranslations("card");
  const locale = useLocale();

  function birthOrAge(): string | null {
    if (card.date_of_birth) {
      const d = new Date(card.date_of_birth);
      return isNaN(d.getTime())
        ? card.date_of_birth
        : d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
    }
    if (card.age_years != null) return `${card.age_years} ${t("years")}`;
    return null;
  }

  const meta = [
    card.species ? card.species.charAt(0).toUpperCase() + card.species.slice(1) : null,
    card.breed_or_morph,
    card.colour,
    card.sex ? card.sex.charAt(0).toUpperCase() + card.sex.slice(1) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const rows: Array<[string, string | null]> = [
    [t("dob"), birthOrAge()],
    [t("microchip"), card.microchip],
    [t("vet"), [card.vet_name, card.vet_phone].filter(Boolean).join(" · ") || null],
    [t("allergies"), card.allergies],
    [t("behaviour"), card.behaviour],
    [t("ownerPhone"), card.owner_phone],
  ];

  const issued = new Date().toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-card bg-white shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between bg-taloa-primary px-5 py-3 text-white">
        <span className="text-xl font-extrabold tracking-wide">TALOA</span>
        <span className="text-xs font-medium uppercase tracking-wider text-white/80">
          {t("cardTitle")}
        </span>
      </div>

      <div className="p-5">
        {/* Foto + nome */}
        <div className="flex items-start gap-4">
          {card.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.photo_url}
              alt={card.name}
              className="h-24 w-24 shrink-0 rounded-input object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold text-slate-800">{card.name}</h2>
            {meta && <p className="mt-1 text-sm text-slate-500">{meta}</p>}
          </div>
        </div>

        {/* Dados */}
        <dl className="mt-5 grid grid-cols-1 gap-3">
          {rows.map(([label, value]) =>
            value ? (
              <div key={label}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </dt>
                <dd className="text-sm text-slate-700">{value}</dd>
              </div>
            ) : null,
          )}
        </dl>

        {/* QR + tag code */}
        <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${API_URL}/v1/tags/${card.tag_code}/qr.png`}
            alt={t("scan")}
            className="h-24 w-24 shrink-0"
            width={96}
            height={96}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{t("scan")}</p>
            <p className="text-sm font-bold text-taloa-primary">{card.tag_code}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between bg-taloa-bg px-5 py-2 text-xs text-slate-400">
        <span>taloa.ie</span>
        <span>{t("issued", { date: issued })}</span>
      </div>
    </div>
  );
}
