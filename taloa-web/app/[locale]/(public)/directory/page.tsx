import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TaloaChat } from "@/components/ai/TaloaChat";
import { DirectoryBrowser } from "@/components/public/DirectoryBrowser";
import { Link } from "@/i18n/navigation";
import { getDirectory, getDirectoryCategories } from "@/lib/api/directory";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "directory" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function DirectoryPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("directory");
  const tc = await getTranslations("common");
  const sp = await searchParams;

  const category = typeof sp.category === "string" ? sp.category : undefined;
  const emergency = sp.emergency_24h === "true";

  // Carrega todos os providers ativos (em memoria no client p/ filtros rapidos)
  // + as contagens por categoria. Tolerante a falha (mostra vazio).
  const [providers, categories] = await Promise.all([
    getDirectory({ limit: 100 }).catch(() => []),
    getDirectoryCategories().catch(() => []),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 p-4">
      <Link href="/" className="text-sm text-taloa-primary">
        ← {tc("goToTaloa")}
      </Link>

      <header>
        <h1 className="text-2xl font-bold text-taloa-primary">{t("title")}</h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </header>

      <div className="flex items-start gap-2 rounded-card bg-taloa-warning/10 p-3 text-xs text-slate-600">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-taloa-warning" />
        <p>{t("disclaimer")}</p>
      </div>

      <DirectoryBrowser
        providers={providers}
        categories={categories}
        initialCategory={category}
        initialEmergency={emergency}
      />

      <TaloaChat context="general" />
    </main>
  );
}
