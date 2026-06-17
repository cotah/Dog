"use client";

import {
  BadgeCheck,
  Clock,
  Globe,
  MapPin,
  MessageSquarePlus,
  Phone,
  Star,
  Tag as TagIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ReviewModal } from "@/components/public/ReviewModal";
import { CATEGORY_ICON } from "@/lib/directory";
import { getReviews } from "@/lib/api/reviews";
import type { PublicProvider } from "@/types/directory";
import type { Review } from "@/types/review";

function speciesKey(s: string): string {
  return `species${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

export function ProviderCard({ provider }: { provider: PublicProvider }) {
  const t = useTranslations("directory");
  const [showReview, setShowReview] = useState(false);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  async function toggleReviews() {
    if (reviews !== null) {
      setReviews(null);
      return;
    }
    setLoadingReviews(true);
    try {
      setReviews(await getReviews(provider.id));
    } finally {
      setLoadingReviews(false);
    }
  }
  const ts = useTranslations("emergency"); // reaproveita os labels de especie
  const icon = CATEGORY_ICON[provider.category] ?? "⭐";
  const catLabel = t.has(`cat.${provider.category}`)
    ? t(`cat.${provider.category}`)
    : provider.category;
  const logo = provider.logo_url || provider.photo_url;

  return (
    <div className="flex flex-col rounded-card bg-white p-4 shadow-sm">
      {/* Cabecalho: logo/icone + nome + categoria */}
      <div className="flex items-start gap-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={provider.name}
            className="h-12 w-12 shrink-0 rounded-input object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input bg-taloa-primary/10 text-2xl">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-slate-800">{provider.name}</h3>
          <p className="text-xs text-slate-400">{catLabel}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {provider.emergency_24h && (
          <span className="rounded-badge bg-taloa-alert px-2 py-0.5 text-xs font-semibold text-white">
            {t("open_24h")}
          </span>
        )}
        {provider.is_taloa_partner && (
          <span className="rounded-badge bg-taloa-secondary px-2 py-0.5 text-xs font-semibold text-white">
            {t("taloa_partner")}
          </span>
        )}
        {provider.is_verified && (
          <span className="flex items-center gap-1 rounded-badge bg-taloa-primary/10 px-2 py-0.5 text-xs font-medium text-taloa-primary">
            <BadgeCheck className="h-3 w-3" /> {t("verified")}
          </span>
        )}
        {provider.rating != null && (
          <span className="flex items-center gap-1 rounded-badge bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {provider.rating.toFixed(1)}
            {provider.review_count > 0 && (
              <span className="text-amber-400">({provider.review_count})</span>
            )}
          </span>
        )}
      </div>

      {/* Descricao */}
      {provider.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
          {provider.description}
        </p>
      )}

      {/* Meta: area, horario, preco */}
      <div className="mt-2 space-y-0.5 text-sm text-slate-500">
        {provider.area && (
          <p className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {provider.area}
            {provider.price_range && (
              <span className="ml-1 text-slate-400">· {provider.price_range}</span>
            )}
          </p>
        )}
        {provider.hours && (
          <p className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {provider.hours}
          </p>
        )}
      </div>

      {/* Especies */}
      {provider.species_supported && provider.species_supported.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {provider.species_supported.map((s) => {
            const key = speciesKey(s);
            return (
              <span
                key={s}
                className="rounded-badge bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
              >
                {ts.has(key) ? ts(key) : s}
              </span>
            );
          })}
        </div>
      )}

      {/* Desconto de parceiro */}
      {provider.is_taloa_partner && provider.partner_discount && (
        <div className="mt-2 flex items-start gap-1.5 rounded-input bg-taloa-secondary/10 px-2 py-1.5 text-xs text-taloa-secondary">
          <TagIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{provider.partner_discount}</span>
        </div>
      )}

      {/* Acoes */}
      <div className="mt-3 flex gap-2">
        {provider.phone && (
          <a
            href={`tel:${provider.phone.replace(/\s/g, "")}`}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-input bg-taloa-primary text-sm font-semibold text-white hover:bg-taloa-secondary"
          >
            <Phone className="h-4 w-4" /> {t("call_now")}
          </a>
        )}
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-input border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Globe className="h-4 w-4" /> {t("visit_website")}
          </a>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-2 flex items-center justify-between text-sm">
        <button
          onClick={() => setShowReview(true)}
          className="flex items-center gap-1.5 font-medium text-taloa-primary hover:underline"
        >
          <MessageSquarePlus className="h-4 w-4" /> {t("leaveReview")}
        </button>
        {provider.review_count > 0 && (
          <button onClick={toggleReviews} className="text-slate-500 hover:underline">
            {reviews !== null
              ? t("hideReviews")
              : t("seeReviews", { count: provider.review_count })}
          </button>
        )}
      </div>

      {loadingReviews && <p className="mt-2 text-xs text-slate-400">…</p>}
      {reviews !== null && (
        <ul className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2">
          {reviews.length === 0 ? (
            <li className="text-xs text-slate-400">{t("noReviews")}</li>
          ) : (
            reviews.map((r) => (
              <li key={r.id} className="text-sm">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${
                        n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                  {r.reviewer_name && (
                    <span className="ml-1 text-xs font-medium text-slate-500">
                      {r.reviewer_name}
                    </span>
                  )}
                </div>
                {r.comment && <p className="text-slate-600">{r.comment}</p>}
              </li>
            ))
          )}
        </ul>
      )}

      {showReview && (
        <ReviewModal
          providerId={provider.id}
          providerName={provider.name}
          onClose={() => setShowReview(false)}
          onSubmitted={() => setReviews(null)}
        />
      )}
    </div>
  );
}
