import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { ContactOwnerButtons } from "@/components/public/ContactOwnerButtons";
import { FoundReportSection } from "@/components/public/FoundReportSection";
import { LostPetBanner } from "@/components/public/LostPetBanner";
import { PetProfileCard } from "@/components/public/PetProfileCard";
import { ServiceLeadsSection } from "@/components/public/ServiceLeadsSection";
import { TravelIdCard } from "@/components/public/TravelIdCard";
import { HabitatIdCard } from "@/components/public/HabitatIdCard";
import { EmergencyCardView } from "@/components/public/EmergencyCardView";
import { TaloaChat } from "@/components/ai/TaloaChat";
import { Link } from "@/i18n/navigation";
import { getPublicTag, logScan } from "@/lib/api/public";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tagCode: string }>;
}): Promise<Metadata> {
  const { locale, tagCode } = await params;
  const t = await getTranslations({ locale, namespace: "tag" });
  try {
    const tag = await getPublicTag(tagCode);
    const name = tag?.pet?.name;
    if (name) {
      const lost = tag.status === "lost";
      return {
        title: lost ? t("lostTitle", { name }) : t("profileTitle", { name }),
        description: lost
          ? t("lostDescription", { name })
          : t("profileDescription", { name }),
      };
    }
  } catch {
    // cai no fallback
  }
  return {
    title: t("fallbackTitle"),
    description: t("fallbackDescription"),
  };
}

async function Shell({ children }: { children: React.ReactNode }) {
  const tc = await getTranslations("common");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      {children}
      <footer className="mt-auto py-4 text-center text-xs text-slate-400">
        {tc("poweredBy")}
      </footer>
    </main>
  );
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tagCode: string }>;
}) {
  const { tagCode } = await params;
  const t = await getTranslations("tag");
  const tc = await getTranslations("common");
  const tag = await getPublicTag(tagCode);

  // Tag inexistente
  if (!tag) {
    return (
      <Shell>
        <div className="mt-10 rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-slate-500">{t("notFoundBody")}</p>
          <Link
            href="/"
            className="mt-4 inline-block font-medium text-taloa-primary"
          >
            {tc("goToTaloa")}
          </Link>
        </div>
      </Shell>
    );
  }

  // Registra o scan (best-effort, server-side)
  const h = await headers();
  const action =
    tag.status === "lost"
      ? "viewed_lost_page"
      : tag.status === "active"
        ? "viewed_profile"
        : "viewed_inactive";
  await logScan({
    tag_code: tag.tag_code,
    action_taken: action,
    user_agent: h.get("user-agent") ?? undefined,
    ip: h.get("x-forwarded-for") ?? undefined,
  });

  // ── INACTIVE ──
  if (tag.status === "inactive") {
    return (
      <Shell>
        <div className="mt-10 rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-taloa-primary">TALOA</h1>
          <p className="mt-2 text-slate-600">{t("inactiveBody")}</p>
          <Link
            href={`/activate/${tag.tag_code}`}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-input bg-taloa-primary px-6 font-semibold text-white hover:bg-taloa-secondary"
          >
            {t("activateCta")}
          </Link>
          <p className="mt-4 text-xs text-slate-400">{tag.tag_code}</p>
        </div>
      </Shell>
    );
  }

  // ── DISABLED ──
  if (tag.status === "disabled") {
    return (
      <Shell>
        <div className="mt-10 rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">{t("disabledTitle")}</h1>
          <p className="mt-2 text-slate-500">{t("disabledBody")}</p>
          <a
            href="mailto:hello@taloa.ie"
            className="mt-4 inline-block font-medium text-taloa-primary"
          >
            hello@taloa.ie
          </a>
        </div>
      </Shell>
    );
  }

  // ── ACTIVE / LOST ──
  if (!tag.pet) {
    return (
      <Shell>
        <div className="mt-10 rounded-card bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">{t("profileUnavailable")}</p>
        </div>
      </Shell>
    );
  }

  const tagType = tag.tag_type ?? "collar_tag";

  // Reunite Flow (Etapa 22): em tags active/lost o chat entra em modo "reunite"
  // (abre sozinho para finders, conduz as 3 perguntas e notifica o dono).
  const chat = (
    <TaloaChat
      context="reunite"
      tagCode={tag.tag_code}
      petContext={{
        name: tag.pet.name,
        species: tag.pet.species,
        breed_or_morph: tag.pet.breed_or_morph,
        colour: tag.pet.colour,
        sex: tag.pet.sex,
        status: tag.status,
      }}
    />
  );

  // ── EMERGENCY CARD ── layout ultra-simples e focado.
  if (tagType === "emergency_card") {
    return (
      <Shell>
        <EmergencyCardView
          pet={tag.pet}
          profile={tag.profile}
          contact={tag.contact}
        />
        {chat}
      </Shell>
    );
  }

  // ── COLLAR / CAT / TRAVEL / HABITAT ── perfil padrao + secao por tipo.
  return (
    <Shell>
      {tag.status === "lost" && (
        <LostPetBanner petName={tag.pet.name} lost={tag.lost} />
      )}

      <PetProfileCard pet={tag.pet} profile={tag.profile} />

      {tagType === "habitat_id" && (
        <HabitatIdCard pet={tag.pet} profile={tag.profile} />
      )}
      {tagType === "travel_id" && <TravelIdCard profile={tag.profile} />}

      <ContactOwnerButtons contact={tag.contact} />

      <FoundReportSection tagCode={tag.tag_code} />

      {/* Servicos: discreto e so quando NAO esta perdido (foco na emergencia) */}
      {tag.status === "active" && (
        <ServiceLeadsSection petName={tag.pet.name} tagCode={tag.tag_code} />
      )}

      {chat}
    </Shell>
  );
}
