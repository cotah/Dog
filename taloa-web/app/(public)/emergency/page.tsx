import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TaloaChat } from "@/components/ai/TaloaChat";
import { EmergencyDirectory } from "@/components/public/EmergencyDirectory";
import { getVetClinics } from "@/lib/api/public";
import type { PublicVet } from "@/types/vet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Emergency Vets in Dublin — TALOA",
  description:
    "A directory of Dublin veterinary clinics, including 24-hour emergency care. Find a vet fast when your pet needs help.",
};

export default async function EmergencyPage() {
  let clinics: PublicVet[] = [];
  try {
    clinics = await getVetClinics();
  } catch {
    clinics = [];
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      <div>
        <Link href="/" className="text-sm font-medium text-taloa-primary">
          ← TALOA
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">Emergency vets</h1>
        <p className="text-sm text-slate-500">Dublin veterinary directory.</p>
      </div>

      {/* Disclaimer fixo e visivel no topo */}
      <div className="rounded-card border border-taloa-warning/30 bg-taloa-warning/10 p-3">
        <div className="flex gap-2 text-sm text-slate-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-taloa-warning" />
          <p>
            TALOA provides this directory for information only. Always call the clinic
            to confirm availability and suitability for your pet&apos;s species. This is
            not veterinary advice.
          </p>
        </div>
      </div>

      <EmergencyDirectory clinics={clinics} />

      <TaloaChat context="emergency" />
    </main>
  );
}
