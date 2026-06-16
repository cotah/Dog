"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { TAG_PREFIX } from "@/lib/constants";

// Busca por codigo digitavel: alternativa ao scan do QR (caes bravos, tag
// danificada, etc.). Normaliza o input e leva ao perfil publico /t/[code].
export function TagCodeSearch() {
  const t = useTranslations("home");
  const router = useRouter();
  const [code, setCode] = useState("");

  // "tal-000001" / " TAL 000001 " -> "TAL-000001"; "1" -> "TAL-000001".
  function normalize(raw: string): string {
    const v = raw.trim().toUpperCase().replace(/\s+/g, "");
    if (!v) return "";
    if (/^\d+$/.test(v)) return `${TAG_PREFIX}-${v.padStart(6, "0")}`;
    return v;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = normalize(code);
    if (!target) return;
    router.push(`/t/${target}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("tagSearchPlaceholder")}
        aria-label={t("tagSearchPlaceholder")}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="h-12 flex-1 rounded-input border border-slate-300 px-4 text-center outline-none focus:border-taloa-primary sm:text-left"
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="flex h-12 items-center justify-center gap-2 rounded-input bg-taloa-primary px-5 font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
      >
        <Search className="h-5 w-5" />
        {t("tagSearchButton")}
      </button>
    </form>
  );
}
