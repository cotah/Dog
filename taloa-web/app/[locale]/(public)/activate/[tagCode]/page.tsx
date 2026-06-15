import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getPublicTag } from "@/lib/api/public";

import { ActivateForm } from "./activate-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "activate" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-4">
      <div className="w-full rounded-card bg-white p-8 text-center shadow-sm">
        {children}
      </div>
    </main>
  );
}

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ locale: string; tagCode: string }>;
}) {
  const { tagCode } = await params;
  const t = await getTranslations("activate");
  const tag = await getPublicTag(tagCode);

  if (!tag) {
    return (
      <Centered>
        <h1 className="text-xl font-bold text-slate-800">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-slate-500">{t("notFoundBody")}</p>
      </Centered>
    );
  }

  // Tag ja ativada (ou perdida/desativada) — nao reativa
  if (tag.status !== "inactive") {
    return (
      <Centered>
        <h1 className="text-xl font-bold text-slate-800">
          {t("alreadySetupTitle")}
        </h1>
        <p className="mt-2 text-slate-500">{t("alreadySetupBody")}</p>
        <Link
          href={`/t/${tag.tag_code}`}
          className="mt-4 inline-block font-medium text-taloa-primary"
        >
          {t("viewProfile")}
        </Link>
      </Centered>
    );
  }

  return <ActivateForm tagCode={tag.tag_code} />;
}
