import {
  Bird,
  Cat,
  Dog,
  Fish,
  PawPrint,
  Rabbit,
  Turtle,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import type { PublicPet, PublicProfile } from "@/types/tag";

const SPECIES_ICON: Record<string, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  fish: Fish,
  rabbit: Rabbit,
  reptile: Turtle,
  small_mammal: Rabbit,
};

function SpeciesIcon({ species, className }: { species: string; className?: string }) {
  const Icon = SPECIES_ICON[species] ?? PawPrint;
  return <Icon className={className} />;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-input bg-taloa-bg px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}

export function PetProfileCard({
  pet,
  profile,
}: {
  pet: PublicPet;
  profile: PublicProfile | null;
}) {
  const t = useTranslations("profile");
  const subtitle = [
    pet.breed_or_morph,
    pet.age_years ? `${pet.age_years}y` : null,
    pet.colour,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-sm">
      {/* Foto / placeholder */}
      <div className="flex h-56 items-center justify-center bg-taloa-primary/5">
        {pet.photo_url ? (
          <Image
            src={pet.photo_url}
            alt={pet.name}
            width={400}
            height={224}
            className="h-56 w-full object-cover"
          />
        ) : (
          <SpeciesIcon species={pet.species} className="h-20 w-20 text-taloa-primary/40" />
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2">
          <SpeciesIcon species={pet.species} className="h-6 w-6 text-taloa-primary" />
          <h1 className="text-2xl font-bold text-slate-800">{pet.name}</h1>
        </div>
        {subtitle && <p className="mt-1 text-sm capitalize text-slate-500">{subtitle}</p>}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Detail label={t("allergies")} value={profile?.allergies ?? null} />
          <Detail label={t("medication")} value={profile?.medication ?? null} />
          <Detail label={t("behaviour")} value={profile?.behaviour ?? null} />
          <Detail label={t("vet")} value={profile?.vet_name ?? null} />
        </div>

        {profile?.public_notes && (
          <p className="mt-4 text-slate-600">{profile.public_notes}</p>
        )}

        {profile?.emergency_notes && (
          <div className="mt-4 rounded-input border-l-4 border-taloa-warning bg-taloa-warning/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-taloa-warning">
              {t("emergencyNotes")}
            </p>
            <p className="text-slate-700">{profile.emergency_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
