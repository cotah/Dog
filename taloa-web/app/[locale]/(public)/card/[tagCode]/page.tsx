import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PetIdCard } from "@/components/owner/PetIdCard";
import { Link } from "@/i18n/navigation";
import { getCard } from "@/lib/api/card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tagCode: string }>;
}): Promise<Metadata> {
  const { locale, tagCode } = await params;
  const t = await getTranslations({ locale, namespace: "card" });
  const card = await getCard(tagCode);
  return {
    title: card ? t("metaTitle", { name: card.name }) : t("cardTitle"),
    description: t("metaDescription"),
  };
}

// Pagina publica minimalista do card — para partilhar com sitter/vet/hotel.
export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ locale: string; tagCode: string }>;
}) {
  const { locale, tagCode } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("card");
  const card = await getCard(tagCode);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-4">
      {!card ? (
        <div className="rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-slate-500">{t("notFoundBody")}</p>
          <Link href="/" className="mt-4 inline-block font-medium text-taloa-primary">
            taloa.ie
          </Link>
        </div>
      ) : (
        <PetIdCard card={card} />
      )}
    </main>
  );
}
