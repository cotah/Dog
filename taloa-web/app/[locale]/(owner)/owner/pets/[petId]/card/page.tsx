import { getTranslations, setRequestLocale } from "next-intl/server";

import { CardActions } from "@/components/owner/CardActions";
import { PetIdCard } from "@/components/owner/PetIdCard";
import { Link } from "@/i18n/navigation";
import { getCard } from "@/lib/api/card";

export const dynamic = "force-dynamic";

// Preview da carteira do pet (dono). Recebe ?tag=CODE vindo do dashboard.
// Usa o endpoint publico do card (WYSIWYG: ve o mesmo que quem recebe o link).
export default async function PetCardPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; petId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const tagCode = typeof sp.tag === "string" ? sp.tag : null;
  const t = await getTranslations("card");

  const card = tagCode ? await getCard(tagCode) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 p-4">
      <Link href="/owner/dashboard" className="text-sm text-taloa-primary">
        ← {t("backToDashboard")}
      </Link>
      <h1 className="text-2xl font-bold text-taloa-primary">{t("previewTitle")}</h1>

      {!card ? (
        <div className="rounded-card bg-white p-8 text-center text-slate-500 shadow-sm">
          {t("noTag")}
        </div>
      ) : (
        <>
          <PetIdCard card={card} />
          <CardActions tagCode={card.tag_code} />
          <p className="text-center text-xs text-slate-400">{t("shareHint")}</p>
        </>
      )}
    </main>
  );
}
