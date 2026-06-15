"use client";

import {
  CheckCircle2,
  Footprints,
  GraduationCap,
  Home,
  Scissors,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SERVICE_OPTIONS } from "@/lib/api/leads";

import { ServiceLeadModal } from "./ServiceLeadModal";

const ICONS = {
  dog_walking: Footprints,
  grooming: Scissors,
  training: GraduationCap,
  daycare: Home,
} as const;

// Secao discreta de servicos, abaixo do perfil. Cada botao abre um modal
// com o service_type ja pre-preenchido. NAO e renderizada em modo lost.
export function ServiceLeadsSection({
  petName,
  tagCode,
}: {
  petName: string;
  tagCode: string;
}) {
  const t = useTranslations("services");
  const [active, setActive] = useState<(typeof SERVICE_OPTIONS)[number] | null>(
    null,
  );
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-card border border-slate-200 bg-white p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-taloa-primary" />
        <p className="mt-2 font-medium text-slate-700">{t("thanks")}</p>
      </div>
    );
  }

  return (
    <section className="rounded-card border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">
        {t("needHelp", { petName })}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SERVICE_OPTIONS.map((svc) => {
          const Icon = ICONS[svc.type];
          return (
            <button
              key={svc.type}
              type="button"
              onClick={() => setActive(svc)}
              className="flex h-12 items-center justify-center gap-2 rounded-input border border-slate-200 text-sm font-medium text-slate-600 hover:border-taloa-primary hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 text-slate-400" />
              {t(svc.type)}
            </button>
          );
        })}
      </div>

      {active && (
        <ServiceLeadModal
          serviceType={active.type}
          serviceLabel={t(active.type)}
          petName={petName}
          tagCode={tagCode}
          onClose={() => setActive(null)}
          onSuccess={() => {
            setActive(null);
            setDone(true);
          }}
        />
      )}
    </section>
  );
}
