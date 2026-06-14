import { headers } from "next/headers";
import Link from "next/link";

import { ContactOwnerButtons } from "@/components/public/ContactOwnerButtons";
import { FoundReportSection } from "@/components/public/FoundReportSection";
import { LostPetBanner } from "@/components/public/LostPetBanner";
import { PetProfileCard } from "@/components/public/PetProfileCard";
import { ServiceLeadsSection } from "@/components/public/ServiceLeadsSection";
import { getPublicTag, logScan } from "@/lib/api/public";

export const dynamic = "force-dynamic";

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

export default async function TagPage({
  params,
}: {
  params: Promise<{ tagCode: string }>;
}) {
  const { tagCode } = await params;
  const tag = await getPublicTag(tagCode);

  // Tag inexistente
  if (!tag) {
    return (
      <Shell>
        <div className="mt-10 rounded-card bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Tag not found</h1>
          <p className="mt-2 text-slate-500">
            We couldn&apos;t find a TALOA tag with this code.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block font-medium text-taloa-primary"
          >
            Go to taloa.ie
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
          <p className="mt-2 text-slate-600">
            This tag isn&apos;t activated yet. Activate it to create your
            pet&apos;s digital safety ID.
          </p>
          <Link
            href={`/activate/${tag.tag_code}`}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-input bg-taloa-primary px-6 font-semibold text-white hover:bg-taloa-secondary"
          >
            Activate this tag
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
          <h1 className="text-xl font-bold text-slate-800">Tag disabled</h1>
          <p className="mt-2 text-slate-500">
            This TALOA tag has been disabled. If you found a pet, please contact
            us.
          </p>
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
          <p className="text-slate-500">This pet&apos;s profile is unavailable.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {tag.status === "lost" && (
        <LostPetBanner petName={tag.pet.name} lost={tag.lost} />
      )}

      <PetProfileCard pet={tag.pet} profile={tag.profile} />

      <ContactOwnerButtons contact={tag.contact} />

      <FoundReportSection tagCode={tag.tag_code} />

      {/* Servicos: discreto e so quando NAO esta perdido (foco na emergencia) */}
      {tag.status === "active" && (
        <ServiceLeadsSection petName={tag.pet.name} tagCode={tag.tag_code} />
      )}
    </Shell>
  );
}
