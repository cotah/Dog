"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

// Botao de compartilhar: usa a Web Share API nativa quando disponivel
// (celular), com fallback para copiar o link para a area de transferencia.
export function ShareButton({
  petName,
  shareUrl,
}: {
  petName: string;
  shareUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const data = {
      title: `Help find ${petName}`,
      text: `${petName} is missing. Please help share and bring ${petName} home.`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // usuario cancelou ou share falhou — cai para o fallback de copiar
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sem clipboard: ultimo recurso, abre o prompt do navegador
      window.prompt("Copy this link to share:", shareUrl);
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-input border-2 border-taloa-primary font-semibold text-taloa-primary hover:bg-taloa-primary/5"
    >
      {copied ? (
        <>
          <Check className="h-5 w-5" /> Link copied
        </>
      ) : (
        <>
          <Share2 className="h-5 w-5" /> Share this poster
        </>
      )}
    </button>
  );
}
