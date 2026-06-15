import path from "node:path";
import withPWAInit from "@ducanh2912/next-pwa";

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

export default withPWA(nextConfig);
