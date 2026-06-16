import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { SiteFooter } from "@/components/SiteFooter";

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
      </main>
      <SiteFooter />
    </div>
  );
}
