import { Pill, Plane, Stethoscope, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PublicProfile } from "@/types/tag";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Plane;
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

// Layout especifico do Travel ID: instrucoes de viagem, aprovacao para voo,
// dados medicos e vet em destaque.
export function TravelIdCard({ profile }: { profile: PublicProfile | null }) {
  const t = useTranslations("travel");

  return (
    <div className="rounded-card bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-taloa-primary" />
          <h2 className="text-lg font-bold text-slate-800">{t("title")}</h2>
        </div>
        {profile?.airline_approved != null && (
          <span
            className={`rounded-badge px-2 py-0.5 text-xs font-semibold ${
              profile.airline_approved
                ? "bg-taloa-primary/10 text-taloa-primary"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {profile.airline_approved ? t("airlineApproved") : t("notApproved")}
          </span>
        )}
      </div>

      <Row icon={Plane} label={t("instructions")} value={profile?.travel_notes} />
      <Row icon={TriangleAlert} label={t("allergies")} value={profile?.allergies} />
      <Row icon={Pill} label={t("medication")} value={profile?.medication} />
      <Row icon={Stethoscope} label={t("vet")} value={profile?.vet_name} />
    </div>
  );
}
