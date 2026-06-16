"use client";

import { CheckCircle2, HeartHandshake, Stethoscope } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";

import { FoundReportForm } from "./FoundReportForm";

// Secao "I Found This Pet" + "Emergency Vets".
// O formulario abre INLINE na mesma pagina (sem redirecionar).
export function FoundReportSection({ tagCode }: { tagCode: string }) {
  const t = useTranslations("found");
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-card border border-taloa-primary/20 bg-taloa-primary/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-taloa-primary" />
        <h3 className="mt-2 text-lg font-semibold text-slate-800">
          {t("thankYou")}
        </h3>
        <p className="text-slate-600">{t("ownerNotified")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-12 items-center justify-center gap-2 rounded-input border text-sm font-medium ${
            open
              ? "border-taloa-primary bg-taloa-primary/5 text-taloa-primary"
              : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <HeartHandshake className="h-4 w-4" />
          {t("iFoundThisPet")}
        </button>
        <Link
          href={{
            pathname: "/directory",
            query: { category: "vet_emergency", emergency_24h: "true" },
          }}
          onClick={() =>
            track("emergency_vets_clicked", {
              tag_code: tagCode,
              source: "profile",
            })
          }
          className="flex h-12 items-center justify-center gap-2 rounded-input border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Stethoscope className="h-4 w-4" />
          {t("emergencyVets")}
        </Link>
      </div>

      {open && (
        <FoundReportForm
          tagCode={tagCode}
          onSuccess={() => {
            setOpen(false);
            setDone(true);
          }}
        />
      )}
    </div>
  );
}
