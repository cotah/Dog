import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CarerView } from "@/components/public/CarerView";
import { Link } from "@/i18n/navigation";
import { getCare } from "@/lib/api/care";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "care" });
  // Sem detalhes do pet no metadata (link privado de cuidado).
  return { title: t("metaTitle"), description: t("metaDescription"), robots: "noindex" };
}

// Pagina do carer — perfil completo via token temporario. Expira/revoga server-side.
export default async function CarePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("care");
  const care = await getCare(token);

  if (!care) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-4">
        <div className="rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">{t("expiredTitle")}</h1>
          <p className="mt-2 text-slate-500">{t("expiredBody")}</p>
          <Link href="/" className="mt-4 inline-block font-medium text-taloa-primary">
            taloa.ie
          </Link>
        </div>
      </main>
    );
  }

  return <CarerView care={care} />;
}
