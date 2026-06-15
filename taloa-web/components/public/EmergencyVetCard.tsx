import { Clock, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PublicVet } from "@/types/vet";

// Mapeia a especie para a chave de traducao (ex: small_mammal -> speciesSmall_mammal).
function speciesKey(s: string): string {
  return `species${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

export function EmergencyVetCard({ vet }: { vet: PublicVet }) {
  const t = useTranslations("emergency");

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-800">{vet.name}</h3>
        {vet.emergency_24h && (
          <span className="shrink-0 rounded-badge bg-taloa-alert px-2 py-0.5 text-xs font-semibold text-white">
            24h
          </span>
        )}
      </div>

      <div className="mt-1 space-y-0.5 text-sm text-slate-500">
        {vet.area && (
          <p className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {vet.area}
          </p>
        )}
        {vet.hours && (
          <p className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {vet.hours}
          </p>
        )}
      </div>

      {vet.species_supported && vet.species_supported.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {vet.species_supported.map((s) => {
            const key = speciesKey(s);
            return (
              <span
                key={s}
                className="rounded-badge bg-taloa-primary/10 px-2 py-0.5 text-xs text-taloa-primary"
              >
                {t.has(key) ? t(key) : s}
              </span>
            );
          })}
        </div>
      )}

      <a
        href={`tel:${vet.phone.replace(/\s/g, "")}`}
        className="mt-3 flex h-12 items-center justify-center gap-2 rounded-input bg-taloa-primary text-base font-semibold text-white hover:bg-taloa-secondary"
      >
        <Phone className="h-5 w-5" />
        {t("callNow", { phone: vet.phone })}
      </a>
    </div>
  );
}
