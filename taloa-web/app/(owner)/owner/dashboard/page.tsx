import { formatDistanceToNow } from "date-fns";
import { Bell, PawPrint } from "lucide-react";
import Image from "next/image";

import { TaloaChat } from "@/components/ai/TaloaChat";
import { PetCard } from "@/components/owner/PetCard";
import { ServiceInterest } from "@/components/owner/ServiceInterest";
import { apiFetchServer } from "@/lib/api/server";
import type { Dashboard, FoundReportSummary } from "@/types/owner";

import { LogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

function FoundNotice({ reports }: { reports: FoundReportSummary[] }) {
  return (
    <div className="rounded-card border border-taloa-warning/30 bg-taloa-warning/10 p-4">
      <div className="flex items-center gap-2 text-taloa-warning">
        <Bell className="h-5 w-5" />
        <h3 className="font-semibold">
          {reports.length} found report{reports.length > 1 ? "s" : ""}
        </h3>
      </div>
      <ul className="mt-2 space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="rounded-input bg-white/70 p-3 text-sm">
            <p className="font-medium text-slate-700">
              Someone found {r.pet_name ?? "your pet"}
              {r.created_at
                ? ` · ${formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}`
                : ""}
            </p>
            {r.found_area && <p className="text-slate-500">Area: {r.found_area}</p>}
            {r.finder_phone && (
              <a
                href={`tel:${r.finder_phone}`}
                className="font-medium text-taloa-primary"
              >
                Call finder: {r.finder_phone}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function OwnerDashboard() {
  let data: Dashboard | null = null;
  let error: string | null = null;
  try {
    data = await apiFetchServer<Dashboard>("/v1/owner/dashboard");
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load your dashboard.";
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-taloa-alert">⚠ {error ?? "Something went wrong."}</p>
        <LogoutButton />
      </main>
    );
  }

  const firstName = data.owner.name?.split(" ")[0] ?? "there";
  const primaryPhoto = data.pets.find((p) => p.photo_url)?.photo_url ?? null;
  const firstPet = data.pets[0];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-taloa-primary/10">
            {primaryPhoto ? (
              <Image
                src={primaryPhoto}
                alt="Pet"
                width={48}
                height={48}
                className="h-12 w-12 object-cover"
              />
            ) : (
              <PawPrint className="h-6 w-6 text-taloa-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">Hi, {firstName}</p>
            <p className="text-xs text-slate-400">
              {data.pets.length} pet{data.pets.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <LogoutButton />
      </header>

      {/* Notificacoes */}
      {data.pending_found_reports.length > 0 && (
        <FoundNotice reports={data.pending_found_reports} />
      )}

      {/* Pets */}
      {data.pets.length === 0 ? (
        <div className="rounded-card bg-white p-8 text-center text-slate-500 shadow-sm">
          You don&apos;t have any pets yet. Activate a TALOA tag to get started.
        </div>
      ) : (
        data.pets.map((pet) => <PetCard key={pet.id} pet={pet} />)
      )}

      {/* Interesse em servicos */}
      <ServiceInterest petId={firstPet?.id} tagCode={firstPet?.tag?.tag_code} />

      <TaloaChat context="general" />
    </main>
  );
}
