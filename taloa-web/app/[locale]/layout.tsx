import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";

import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { routing } from "@/i18n/routing";

import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TALOA — Smart Safety for Pets",
  description: "Smart safety for pets, starting in Dublin.",
  applicationName: "TALOA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TALOA",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// Next 15: theme_color vai no export viewport (nao mais no metadata).
export const viewport: Viewport = {
  themeColor: "#1A3A5C",
  width: "device-width",
  initialScale: 1,
};

// Pre-gera as rotas estaticas dos 6 idiomas.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Locale invalido nao deveria chegar aqui (o middleware filtra), mas garante.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Habilita render estatico com o locale correto.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <PostHogProvider>
          <NextIntlClientProvider>
            <LocaleSwitcher />
            {children}
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
