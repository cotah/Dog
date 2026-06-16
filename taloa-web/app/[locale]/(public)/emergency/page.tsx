import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

// Etapa 23 (decisao 1A): /emergency foi absorvida pelo Partners Directory.
// Mantemos a URL viva como redirect (preserva links/QRs antigos) apontando
// para o directory ja filtrado em veterinarios de emergencia 24h.
export default async function EmergencyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({
    href: {
      pathname: "/directory",
      query: { category: "vet_emergency", emergency_24h: "true" },
    },
    locale,
  });
}
