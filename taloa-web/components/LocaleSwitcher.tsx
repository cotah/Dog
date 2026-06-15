"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Seletor de idioma fixo no topo direito. Troca o locale preservando a rota
// atual; o next-intl persiste a escolha no cookie NEXT_LOCALE automaticamente.
export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2 py-1 text-sm text-slate-600 shadow-sm backdrop-blur">
      <Globe className="h-4 w-4 text-taloa-primary" aria-hidden />
      <select
        value={locale}
        onChange={onChange}
        disabled={isPending}
        aria-label={t("change")}
        className="cursor-pointer bg-transparent pr-1 outline-none disabled:opacity-60"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {t(l)}
          </option>
        ))}
      </select>
    </div>
  );
}
