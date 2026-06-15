import {
  Bird,
  Cat,
  Dog,
  Fish,
  MapPin,
  PawPrint,
  Rabbit,
  Turtle,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Image from "next/image";

import { ContactOwnerButtons } from "@/components/public/ContactOwnerButtons";
import { FoundReportSection } from "@/components/public/FoundReportSection";
import { ShareButton } from "@/components/public/ShareButton";
import { Link } from "@/i18n/navigation";
import { getPublicTag } from "@/lib/api/public";

export const dynamic = "force-dynamic";

const SPECIES_ICON: Record<string, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  fish: Fish,
  rabbit: Rabbit,
  reptile: Turtle,
  small_mammal: Rabbit,
};

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Monta a URL absoluta da request (funciona local e em producao).
async function absoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "taloa.ie";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tagCode: string }>;
}): Promise<Metadata> {
  const { locale, tagCode } = await params;
  const t = await getTranslations({ locale, namespace: "lost" });
  const tag = await getPublicTag(tagCode).catch(() => null);

  if (!tag || tag.status !== "lost" || !tag.pet) {
    return { title: t("metaFallback") };
  }

  const name = tag.pet.name;
  const area = tag.lost?.last_seen_area;
  const title = area
    ? t("metaTitleArea", { name, area })
    : t("metaTitle", { name });
  const description =
    tag.lost?.description ?? t("metaDescFallback", { name });
  const images = tag.pet.photo_url ? [{ url: tag.pet.photo_url }] : [];

  return {
    title,
    description,
    openGraph: { title, description, images, type: "website" },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
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

export default async function LostPosterPage({
  params,
}: {
  params: Promise<{ locale: string; tagCode: string }>;
}) {
  const { tagCode } = await params;
  const t = await getTranslations("lost");
  const tc = await getTranslations("common");
  const tag = await getPublicTag(tagCode).catch(() => null);

  // Tag inexistente
  if (!tag) {
    return (
      <Shell>
        <div className="mt-10 rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-slate-500">{t("notFoundBody")}</p>
          <Link href="/" className="mt-4 inline-block font-medium text-taloa-primary">
            {tc("goToTaloa")}
          </Link>
        </div>
      </Shell>
    );
  }

  // Pet nao esta perdido (ex: ja foi encontrado) — o cartaz some.
  if (tag.status !== "lost" || !tag.pet) {
    const name = tag.pet?.name;
    return (
      <Shell>
        <div className="mt-10 rounded-card border border-taloa-primary/20 bg-taloa-primary/5 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-800">
            {name ? t("noLongerLostTitle", { name }) : t("safeTitle")}
          </h1>
          <p className="mt-2 text-slate-600">{t("noLongerLostBody")}</p>
          {tag.status === "active" && (
            <Link
              href={`/t/${tag.tag_code}`}
              className="mt-4 inline-block font-medium text-taloa-primary"
            >
              {t("viewProfile")}
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  const pet = tag.pet;
  const Icon = SPECIES_ICON[pet.species] ?? PawPrint;
  const lastSeenDate = formatDate(tag.lost?.last_seen_at);
  const subtitle = [pet.breed_or_morph, pet.colour, pet.sex]
    .filter(Boolean)
    .join(" · ");
  const shareUrl = await absoluteUrl(`/lost/${tag.tag_code}`);

  return (
    <Shell>
      {/* Faixa MISSING */}
      <div className="rounded-t-card bg-taloa-alert px-5 py-3 text-center">
        <p className="text-2xl font-extrabold uppercase tracking-[0.2em] text-white">
          {t("missing")}
        </p>
      </div>

      {/* Foto grande */}
      <div className="-mt-4 overflow-hidden rounded-b-card bg-white shadow-sm">
        <div className="flex aspect-square items-center justify-center bg-taloa-primary/5">
          {pet.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={pet.name}
              width={448}
              height={448}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <Icon className="h-28 w-28 text-taloa-primary/40" />
          )}
        </div>

        <div className="p-5 text-center">
          <h1 className="text-3xl font-bold text-slate-800">{pet.name}</h1>
          {subtitle && (
            <p className="mt-1 text-sm capitalize text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Onde / quando / descricao */}
      {(tag.lost?.last_seen_area || lastSeenDate || tag.lost?.description) && (
        <div className="rounded-card bg-white p-5 shadow-sm">
          {tag.lost?.last_seen_area && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-taloa-alert" />
              <div>
                <p className="font-semibold text-slate-800">
                  {t("lastSeen", { area: tag.lost.last_seen_area })}
                </p>
                {lastSeenDate && (
                  <p className="text-sm text-slate-500">{lastSeenDate}</p>
                )}
              </div>
            </div>
          )}
          {tag.lost?.description && (
            <p className="mt-3 text-slate-600">{tag.lost.description}</p>
          )}
        </div>
      )}

      {/* Contato do dono + compartilhar */}
      <ContactOwnerButtons contact={tag.contact} />
      <ShareButton petName={pet.name} shareUrl={shareUrl} />

      {/* Reportar avistamento / encontrei */}
      <FoundReportSection tagCode={tag.tag_code} />
    </Shell>
  );
}
