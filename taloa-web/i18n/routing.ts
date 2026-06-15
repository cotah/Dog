import { defineRouting } from "next-intl/routing";

// Idiomas suportados pela TALOA (brief v2.0). EN e PT completos; es/fr/de/it
// entram com estrutura criada e traducao placeholder.
// localePrefix "as-needed": EN (default) sem prefixo (taloa.ie/), os demais
// com prefixo (taloa.ie/pt/, /es/ ...). Isso permite que a pagina publica
// /t/[tagCode] caia no idioma do navegador do FINDER via Accept-Language.
export const routing = defineRouting({
  locales: ["en", "pt", "es", "fr", "de", "it"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
