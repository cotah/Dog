"use client";

import { CheckCircle2, HeartHandshake, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FoundReportForm } from "./FoundReportForm";

// Secao "I Found This Pet" + "Emergency Vets".
// O formulario abre INLINE na mesma pagina (sem redirecionar).
export function FoundReportSection({ tagCode }: { tagCode: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-card border border-taloa-primary/20 bg-taloa-primary/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-taloa-primary" />
        <h3 className="mt-2 text-lg font-semibold text-slate-800">Thank you.</h3>
        <p className="text-slate-600">The owner has been notified.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-12 items-center justify-center gap-2 rounded-input border text-sm font-medium ${
            open
              ? "border-taloa-primary bg-taloa-primary/5 text-taloa-primary"
              : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <HeartHandshake className="h-4 w-4" />
          I Found This Pet
        </button>
        <Link
          href="/emergency"
          className="flex h-12 items-center justify-center gap-2 rounded-input border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Stethoscope className="h-4 w-4" />
          Emergency Vets
        </Link>
      </div>

      {open && (
        <FoundReportForm
          tagCode={tagCode}
          onSuccess={() => {
            setOpen(false);
            setDone(true);
          }}
        />
      )}
    </div>
  );
}
