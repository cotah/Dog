import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TaloaChat } from "@/components/ai/TaloaChat";
import { EmergencyDirectory } from "@/components/public/EmergencyDirectory";
import { Link } from "@/i18n/navigation";
import { getVetClinics } from "@/lib/api/public";
import type { PublicVet } from "@/types/vet";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "emergency" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EmergencyPage() {
  const t = await getTranslations("emergency");

  let clinics: PublicVet[] = [];
  try {
    clinics = await getVetClinics();
  } catch {
    clinics = [];
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      <div>
        <Link href="/" className="text-sm font-medium text-taloa-primary">
          {t("backLink")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">{t("title")}</h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      {/* Disclaimer fixo e visivel no topo */}
      <div className="rounded-card border border-taloa-warning/30 bg-taloa-warning/10 p-3">
        <div className="flex gap-2 text-sm text-slate-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-taloa-warning" />
          <p>{t("disclaimer")}</p>
        </div>
      </div>

      <EmergencyDirectory clinics={clinics} />

      <TaloaChat context="emergency" />
    </main>
  );
}
