import { AlertTriangle, Stethoscope } from "lucide-react";
import { useTranslations } from "next-intl";

import { ContactOwnerButtons } from "@/components/public/ContactOwnerButtons";
import { Link } from "@/i18n/navigation";
import type { PublicContact, PublicPet, PublicProfile } from "@/types/tag";

function CriticalBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="rounded-input border-l-4 border-taloa-alert bg-taloa-alert/5 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-taloa-alert">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}

// Layout ultra-simples do Emergency Card: info critica em destaque + botoes
// de emergencia grandes. Sem servicos, sem distracoes.
export function EmergencyCardView({
  pet,
  profile,
  contact,
}: {
  pet: PublicPet;
  profile: PublicProfile | null;
  contact: PublicContact | null;
}) {
  const t = useTranslations("emergencyCard");
  const tf = useTranslations("found");

  return (
    <div className="flex flex-col gap-4">
      {/* Faixa de emergencia */}
      <div className="rounded-card bg-taloa-alert p-5 text-center text-white shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="h-7 w-7 animate-pulse" />
          <h1 className="text-3xl font-extrabold tracking-wide">{t("title")}</h1>
        </div>
        <p className="mt-1 text-white/90">{t("subtitle")}</p>
        <p className="mt-3 text-2xl font-bold">{pet.name}</p>
      </div>

      {/* Info critica */}
      <div className="flex flex-col gap-3">
        <CriticalBlock label={t("conditions")} value={profile?.critical_conditions} />
        <CriticalBlock label={t("medication")} value={profile?.critical_medication} />
        <CriticalBlock label={t("allergies")} value={profile?.allergies} />
        {profile?.blood_type && (
          <div className="rounded-input bg-taloa-bg px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {t("bloodType")}
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {profile.blood_type}
            </p>
          </div>
        )}
      </div>

      {/* Botoes de emergencia grandes */}
      <ContactOwnerButtons contact={contact} />
      <Link
        href="/emergency"
        className="flex h-14 items-center justify-center gap-2 rounded-input border-2 border-taloa-alert text-lg font-semibold text-taloa-alert hover:bg-taloa-alert/5"
      >
        <Stethoscope className="h-5 w-5" />
        {tf("emergencyVets")}
      </Link>
    </div>
  );
}
