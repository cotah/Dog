import path from "node:path";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

// next-intl: aponta para a config de request (carrega messages por locale).
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fixa a raiz de tracing neste app (evita confusao com lockfiles fora do projeto)
  outputFileTracingRoot: path.resolve(),
  images: {
    remotePatterns: [
      // fotos dos pets no Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

// PWA (Etapa 15): service worker via Workbox. O cache padrao do next-pwa ja
// faz NetworkFirst nas navegacoes, entao /t/[tagCode] carrega offline apos a
// 1a visita. Desabilitado em dev (SW so faz sentido no build de producao).
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

// Compoe os wrappers: PWA por dentro, next-intl por fora.
const finalConfig = withNextIntl(withPWA(nextConfig));

// Sentry envolve tudo por ultimo. O upload de source maps so acontece quando
// SENTRY_AUTH_TOKEN esta presente (CI/Vercel) — sem o token o build segue normal,
// apenas sem source maps. Nao quebra o build local nem o de quem nao tem o token.
export default withSentryConfig(finalConfig, {
  org: "capivarex",
  project: "taloa-frontend",
  // So loga no build de CI; mantem o terminal local limpo.
  silent: !process.env.CI,
  // Amplia o upload de source maps p/ cobrir arquivos do client corretamente.
  widenClientFileUpload: true,
  // Remove logs do SDK do bundle de producao (menor + mais limpo).
  disableLogger: true,
});

