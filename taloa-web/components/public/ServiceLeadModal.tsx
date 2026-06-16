"use client";

import { ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { createPublicLead } from "@/lib/api/leads";
import { track } from "@/lib/analytics";
import { Spinner } from "@/components/ui/Spinner";
import { Link } from "@/i18n/navigation";

const inputClass =
  "w-full rounded-input border border-slate-300 px-3 py-2.5 outline-none focus:border-taloa-primary";
const labelClass = "mb-1 block text-sm font-medium text-slate-600";

// Mapeia o service_type do lead para a categoria correspondente no /directory.
// (so "daycare" difere: vira "dog_daycare").
const DIRECTORY_CATEGORY: Record<string, string> = {
  dog_walking: "dog_walking",
  grooming: "grooming",
  training: "training",
  daycare: "dog_daycare",
};

export function ServiceLeadModal({
  serviceType,
  serviceLabel,
  petName,
  tagCode,
  onClose,
  onSuccess,
}: {
  serviceType: string;
  serviceLabel: string;
  petName: string;
  tagCode: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createPublicLead({
        tag_code: tagCode,
        service_type: serviceType,
        contact_name: form.name,
        contact_email: form.email,
        contact_phone: form.phone || undefined,
        message: form.message || undefined,
      });
      track("service_lead_submitted", {
        service_type: serviceType,
        tag_code: tagCode,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("somethingWentWrong"));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-card bg-white p-5 shadow-lg sm:rounded-card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{serviceLabel}</h2>
          <button onClick={onClose} aria-label={t("close")} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          {t("modalIntro", { petName })}
        </p>

        {/* Alternativa: navegar direto ao diretorio na categoria certa. */}
        <Link
          href={{
            pathname: "/directory",
            query: { category: DIRECTORY_CATEGORY[serviceType] ?? "other" },
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-taloa-primary hover:underline"
        >
          {t("findProvider")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>{t("name")}</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("email")}</label>
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder={t("emailPlaceholder")}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("phone")}</label>
            <input
              className={inputClass}
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder={t("phoneOptional")}
            />
          </div>
          <div>
            <label className={labelClass}>{t("message")}</label>
            <textarea
              className={`${inputClass} min-h-20 resize-none`}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder={t("messagePlaceholder")}
            />
          </div>

          {error && <p className="text-sm text-taloa-alert">{error}</p>}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-input border border-slate-300 font-medium text-slate-600 hover:bg-slate-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Spinner /> {t("sending")}
                </>
              ) : (
                t("sendRequest")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
