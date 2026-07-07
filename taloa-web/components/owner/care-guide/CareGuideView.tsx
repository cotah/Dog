"use client";

import {
  Apple,
  Download,
  Hand,
  Home,
  Puzzle,
  Sparkles,
  Thermometer,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { downloadCareGuidePdf, getCareGuide } from "@/lib/api/care-guide";
import type { CareGuideResponse, CareGuideSectionKey } from "@/types/care-guide";

const SECTION_ICONS: Record<CareGuideSectionKey, typeof Home> = {
  habitat: Home,
  feeding: Apple,
  environment: Thermometer,
  handling: Hand,
  hygiene: Sparkles,
  enrichment: Puzzle,
  warning_signs: TriangleAlert,
};

export function CareGuideView({ petId }: { petId: string }) {
  const t = useTranslations("careGuide");
  const [guide, setGuide] = useState<CareGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setGuide(await getCareGuide(petId));
      setLocked(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) setLocked(true);
      else setLoadError(true);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  // Free plan: API devolve 402 -> CTA de upgrade (padrao Travel)
  if (locked) {
    return (
      <div className="rounded-card border border-dashed border-taloa-primary/30 bg-taloa-primary/5 px-6 py-10 text-center">
        <h3 className="mb-1 font-bold text-slate-800">{t("upgradeTitle")}</h3>
        <p className="mb-4 text-sm text-slate-500">{t("upgradeBody")}</p>
        <Link
          href="/pricing"
          className="inline-block rounded-input bg-taloa-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {t("upgradeCta")}
        </Link>
      </div>
    );
  }

  if (loadError || !guide) {
    return (
      <div className="rounded-card border border-dashed border-slate-200 px-6 py-10 text-center">
        <p className="mb-3 text-sm text-slate-500">{t("loadError")}</p>
        <button
          onClick={load}
          className="rounded-input bg-taloa-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  async function downloadPdf() {
    setDownloading(true);
    setPdfError(false);
    try {
      await downloadCareGuidePdf(petId);
    } catch {
      setPdfError(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">{t("title")}</h3>
        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-input bg-taloa-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? t("downloading") : t("downloadPdf")}
        </button>
      </div>

      {pdfError && (
        <p className="rounded-input bg-red-50 px-3 py-2 text-sm text-red-600">
          {t("pdfError")}
        </p>
      )}

      {guide.sections.map((section) => {
        const Icon = SECTION_ICONS[section.key];
        const isWarning = section.key === "warning_signs";
        return (
          <section
            key={section.key}
            className={`rounded-card border p-4 ${
              isWarning ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white"
            }`}
          >
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
              <Icon
                className={`h-4 w-4 ${isWarning ? "text-amber-500" : "text-taloa-primary"}`}
              />
              {t(`sections.${section.key}`)}
            </h4>
            <ul className="flex flex-col gap-1.5">
              {section.tips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-slate-600">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      isWarning ? "bg-amber-400" : "bg-taloa-primary/50"
                    }`}
                  />
                  {t(`tips.${tip}`)}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-center text-xs text-slate-400">{t("disclaimer")}</p>
    </div>
  );
}
