"use client";

import { Check, Download, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cardPdfUrl } from "@/lib/api/card";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://taloa.ie";

// Acoes do preview do card (dono): baixar PDF + copiar o link publico.
export function CardActions({ tagCode }: { tagCode: string }) {
  const t = useTranslations("card");
  const [copied, setCopied] = useState(false);
  const shareUrl = `${APP_URL}/card/${tagCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponivel — ignora */
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2 sm:flex-row">
      <a
        href={cardPdfUrl(tagCode)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary"
      >
        <Download className="h-5 w-5" /> {t("download")}
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-input border border-taloa-primary font-semibold text-taloa-primary hover:bg-taloa-primary/5"
      >
        {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
        {copied ? t("copied") : t("share")}
      </button>
    </div>
  );
}
