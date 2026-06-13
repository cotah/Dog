"use client";

import { Check, Dumbbell, GraduationCap, Scissors } from "lucide-react";
import { useState } from "react";

import { requestService } from "@/lib/api/owner";

const SERVICES = [
  { type: "dog_walking", label: "Walking", Icon: Dumbbell },
  { type: "grooming", label: "Grooming", Icon: Scissors },
  { type: "training", label: "Training", Icon: GraduationCap },
];

export function ServiceInterest({
  petId,
  tagCode,
}: {
  petId?: string;
  tagCode?: string;
}) {
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function onRequest(type: string) {
    if (requested.has(type)) return;
    setBusy(type);
    try {
      await requestService(type, petId, tagCode);
      setRequested((prev) => new Set(prev).add(type));
    } catch {
      // silencioso — o dono pode tentar de novo
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-800">Need a hand in Dublin?</h3>
      <p className="mb-3 text-sm text-slate-500">
        Tap to request a trusted local service.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {SERVICES.map(({ type, label, Icon }) => {
          const done = requested.has(type);
          return (
            <button
              key={type}
              onClick={() => onRequest(type)}
              disabled={done || busy === type}
              className={`flex h-20 flex-col items-center justify-center gap-1 rounded-input border text-sm font-medium transition ${
                done
                  ? "border-taloa-primary bg-taloa-primary/5 text-taloa-primary"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              {done ? "Requested" : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
