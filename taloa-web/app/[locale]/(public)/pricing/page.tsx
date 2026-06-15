import { Check } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PricingButton } from "@/components/public/PricingButton";
import { Link } from "@/i18n/navigation";
import { getPlans } from "@/lib/api/billing";
import type { Plan } from "@/types/billing";

export const dynamic = "force-dynamic";

// Linha 1: planos principais. Linha 2: especializados (€14,99).
const TIERS = ["free", "plus", "club"] as const;
const MORE_TIERS = ["exotic_club", "family"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const tc = await getTranslations("common");

  let plans: Plan[] = [];
  try {
    plans = await getPlans();
  } catch {
    plans = [];
  }
  const byName = new Map(plans.map((p) => [p.name, p]));
  const tiers = TIERS.map((n) => byName.get(n)).filter(Boolean) as Plan[];
  const moreTiers = MORE_TIERS.map((n) => byName.get(n)).filter(Boolean) as Plan[];
  const premiumTag = byName.get("premium_tag");

  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  });

  function features(name: string): string[] {
    const raw = t.raw(`features.${name}`);
    return Array.isArray(raw) ? (raw as string[]) : [];
  }

  // Card de plano reutilizado nas duas linhas.
  function card(plan: Plan, highlight: boolean) {
    const isFree = plan.name === "free";
    return (
      <div
        key={plan.name}
        className={`relative flex flex-col rounded-card bg-white p-6 shadow-sm ${
          highlight ? "ring-2 ring-taloa-primary" : "border border-slate-200"
        }`}
      >
        {highlight && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-badge bg-taloa-primary px-3 py-1 text-xs font-semibold text-white">
            {t("mostPopular")}
          </span>
        )}

        <h2 className="text-lg font-bold text-slate-800">{plan.display_name}</h2>

        <div className="mt-3 flex items-end gap-1">
          <span className="text-3xl font-extrabold text-slate-900">
            {isFree ? t("free") : money.format(plan.price_eur)}
          </span>
          {!isFree && (
            <span className="pb-1 text-sm text-slate-400">{t("perMonth")}</span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-400">
          {t("maxPets", { count: plan.max_pets })}
        </p>

        <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-slate-600">
          {features(plan.name).map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-taloa-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {isFree ? (
            <Link
              href="/signup"
              className="flex h-12 items-center justify-center rounded-input border border-taloa-primary font-semibold text-taloa-primary hover:bg-taloa-primary/5"
            >
              {t("getStarted")}
            </Link>
          ) : (
            <PricingButton
              plan={plan.name}
              label={t("subscribe")}
              highlight={highlight}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <Link href="/" className="text-sm font-medium text-taloa-primary">
          {t("back")}
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">{t("subtitle")}</p>
      </header>

      {/* Linha 1: Free / Plus / Club */}
      <section className="grid gap-5 md:grid-cols-3">
        {tiers.map((plan) => card(plan, plan.name === "club"))}
      </section>

      {/* Linha 2: Exotic Club / Family */}
      {moreTiers.length > 0 && (
        <section className="grid gap-5 sm:grid-cols-2 md:mx-auto md:w-2/3 md:max-w-3xl">
          {moreTiers.map((plan) => card(plan, false))}
        </section>
      )}

      {/* Rodape: Premium Tag avulsa (pagamento unico) */}
      {premiumTag && (
        <section className="mt-2 rounded-card border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {premiumTag.display_name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{t("premiumTagDesc")}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-2xl font-extrabold text-slate-900">
                  {money.format(premiumTag.price_eur)}
                </span>
                <span className="block text-xs text-slate-400">
                  {t("oneTime")}
                </span>
              </div>
              <PricingButton plan={premiumTag.name} label={t("buy")} />
            </div>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-slate-400">{tc("poweredBy")}</p>
    </main>
  );
}
