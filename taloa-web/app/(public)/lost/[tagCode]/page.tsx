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
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import { ContactOwnerButtons } from "@/components/public/ContactOwnerButtons";
import { FoundReportSection } from "@/components/public/FoundReportSection";
import { ShareButton } from "@/components/public/ShareButton";
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
  params: Promise<{ tagCode: string }>;
}): Promise<Metadata> {
  const { tagCode } = await params;
  const tag = await getPublicTag(tagCode).catch(() => null);

  if (!tag || tag.status !== "lost" || !tag.pet) {
    return { title: "TALOA — Lost pet" };
  }

  const name = tag.pet.name;
  const area = tag.lost?.last_seen_area;
  const title = `LOST: ${name}${area ? ` — ${area}` : ""}`;
  const description =
    tag.lost?.description ??
    `${name} is missing. If you have seen ${name}, please contact the owner.`;
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      {children}
      <footer className="mt-auto py-4 text-center text-xs text-slate-400">
        Powered by TALOA — taloa.ie
      </footer>
    </main>
  );
}

export default async function LostPosterPage({
  params,
}: {
  params: Promise<{ tagCode: string }>;
}) {
  const { tagCode } = await params;
  const tag = await getPublicTag(tagCode).catch(() => null);

  // Tag inexistente
  if (!tag) {
    return (
      <Shell>
        <div className="mt-10 rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Tag not found</h1>
          <p className="mt-2 text-slate-500">
            We couldn&apos;t find a TALOA tag with this code.
          </p>
          <Link href="/" className="mt-4 inline-block font-medium text-taloa-primary">
            Go to taloa.ie
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
            {name ? `${name} is no longer marked as lost` : "This pet is safe"}
          </h1>
          <p className="mt-2 text-slate-600">
            Good news — this pet is not currently missing.
          </p>
          {tag.status === "active" && (
            <Link
              href={`/t/${tag.tag_code}`}
              className="mt-4 inline-block font-medium text-taloa-primary"
            >
              View pet profile
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
          Missing
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
                  Last seen: {tag.lost.last_seen_area}
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
