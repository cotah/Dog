import { PawPrint } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";

import { DiaryView } from "@/components/owner/diary/DiaryView";
import { Link } from "@/i18n/navigation";
import { apiFetchServer } from "@/lib/api/server";
import type { Dashboard } from "@/types/owner";

export const dynamic = "force-dynamic";

export default async function PetDiaryPage({
  params,
}: {
  params: Promise<{ locale: string; petId: string }>;
}) {
  const { locale, petId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("diary");

  let pet = null;
  try {
    const data = await apiFetchServer<Dashboard>("/v1/owner/dashboard");
    pet = data.pets.find((p) => p.id === petId) ?? null;
  } catch {
    pet = null;
  }

  if (!pet) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <Link href="/owner/dashboard" className="text-sm font-medium text-taloa-primary">
          {t("back")}
        </Link>
        <p className="rounded-card border border-dashed border-slate-200 py-12 text-center text-slate-400">
          {t("emptyTimeline")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-4 py-8">
      <Link href="/owner/dashboard" className="text-sm font-medium text-taloa-primary">
        {t("back")}
      </Link>

      <header className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-input bg-taloa-primary/5">
          {pet.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={pet.name}
              width={56}
              height={56}
              className="h-14 w-14 object-cover"
            />
          ) : (
            <PawPrint className="h-6 w-6 text-taloa-primary/40" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pet.name}</h1>
          <p className="text-sm capitalize text-slate-500">{pet.species}</p>
        </div>
      </header>

      <DiaryView petId={pet.id} species={pet.species} />
    </main>
  );
}
