import { Award, Sparkles, Tag } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { TagCodeSearch } from "@/components/public/TagCodeSearch";

// Perks do TALOA Club mostrados na landing. Texto vem do i18n (namespace home).
const CLUB_PERKS = [
  { Icon: Tag, titleKey: "clubPerk1Title", descKey: "clubPerk1Desc" },
  { Icon: Award, titleKey: "clubPerk2Title", descKey: "clubPerk2Desc" },
  { Icon: Sparkles, titleKey: "clubPerk3Title", descKey: "clubPerk3Desc" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="text-4xl font-bold text-taloa-primary">{t("title")}</h1>
        <p className="max-w-md text-lg text-slate-600">{t("subtitle")}</p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-input bg-taloa-primary px-5 py-3 font-medium text-white hover:bg-taloa-secondary"
          >
            {tc("login")}
          </Link>
          <Link
            href="/signup"
            className="rounded-input border border-taloa-primary px-5 py-3 font-medium text-taloa-primary hover:bg-taloa-primary/5"
          >
            {tc("signup")}
          </Link>
        </div>

        {/* Busca por codigo digitavel — alternativa ao scan do QR */}
        <section className="mt-6 flex w-full max-w-md flex-col items-center gap-3 border-t border-slate-200 pt-8">
          <h2 className="text-sm font-medium text-slate-500">
            {t("tagSearchTitle")}
          </h2>
          <TagCodeSearch />
        </section>

        {/* Member Benefits — perks do TALOA Club. Texto aspiracional mas honesto
            ("we're building" / "new partners added monthly"); sem prometer
            descontos especificos que ainda nao existem. */}
        <section className="mt-10 w-full max-w-5xl border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-bold text-taloa-primary sm:text-3xl">
            {t("clubTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            {t("clubSubtitle")}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {CLUB_PERKS.map(({ Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="flex flex-col items-center gap-3 rounded-card border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-taloa-primary/10 text-taloa-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="inline-flex items-center rounded-full bg-taloa-accent/10 px-2.5 py-0.5 text-xs font-medium text-taloa-accent">
                  {t("clubBadge")}
                </span>
                <h3 className="text-lg font-semibold text-slate-800">
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-slate-600">{t(descKey)}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-input bg-taloa-accent px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              {t("clubCta")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
