import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fixa a raiz de tracing neste app (evita confusao com lockfiles fora do projeto)
  outputFileTracingRoot: path.resolve(),
  // PWA (next-pwa) sera configurado na Etapa 15.
  images: {
    remotePatterns: [
      // fotos dos pets no Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
