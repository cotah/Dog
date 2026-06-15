import {
  Droplets,
  Hand,
  Leaf,
  Sun,
  Thermometer,
  Utensils,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { PublicPet, PublicProfile } from "@/types/tag";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Leaf;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-t border-slate-100 py-3 first:border-t-0 first:pt-0">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-taloa-primary" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-slate-700">{value}</p>
      </div>
    </div>
  );
}

// Layout especifico do Habitat ID (exoticos): temperatura, alimentacao,
// manuseio, iluminacao, humidade e vet especializado.
export function HabitatIdCard({
  pet,
  profile,
}: {
  pet: PublicPet;
  profile: PublicProfile | null;
}) {
  const t = useTranslations("habitat");
  const ts = useTranslations("species");

  const min = profile?.habitat_temp_min;
  const max = profile?.habitat_temp_max;
  let temp: string | null = null;
  if (min != null && max != null) temp = t("tempRange", { min, max });
  else if (min != null) temp = t("tempMin", { value: min });
  else if (max != null) temp = t("tempMax", { value: max });

  const speciesLabel = ts.has(pet.species) ? ts(pet.species) : pet.species;

  return (
    <div className="rounded-card bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Leaf className="h-5 w-5 text-taloa-primary" />
        <h2 className="text-lg font-bold text-slate-800">{t("title")}</h2>
      </div>

      <Row icon={Leaf} label={t("species")} value={speciesLabel} />
      <Row icon={Thermometer} label={t("temperature")} value={temp} />
      <Row icon={Utensils} label={t("feeding")} value={profile?.feeding_schedule} />
      <Row icon={Hand} label={t("handling")} value={profile?.handling_notes} />
      <Row icon={Sun} label={t("lighting")} value={profile?.lighting_notes} />
      <Row icon={Droplets} label={t("humidity")} value={profile?.humidity_notes} />
    </div>
  );
}
