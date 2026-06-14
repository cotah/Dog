"use client";

import { useState } from "react";

import type { PublicVet } from "@/types/vet";

import { EmergencyVetCard } from "./EmergencyVetCard";

const EXOTIC = ["reptile", "bird", "rabbit", "small_mammal"];

const FILTERS: { key: string; label: string; match: (s: string[]) => boolean }[] = [
  { key: "all", label: "All Species", match: () => true },
  { key: "dogs_cats", label: "Dogs & Cats", match: (s) => s.includes("dog") || s.includes("cat") },
  { key: "reptiles", label: "Reptiles", match: (s) => s.includes("reptile") },
  { key: "birds", label: "Birds", match: (s) => s.includes("bird") },
  { key: "small", label: "Rabbits & Small Pets", match: (s) => s.includes("rabbit") || s.includes("small_mammal") },
  { key: "exotics", label: "Exotics", match: (s) => EXOTIC.some((x) => s.includes(x)) },
];

export function EmergencyDirectory({ clinics }: { clinics: PublicVet[] }) {
  const [filter, setFilter] = useState("all");
  const [only24h, setOnly24h] = useState(false);

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const visible = clinics.filter((c) => {
    const species = c.species_supported ?? [];
    return active.match(species) && (!only24h || c.emergency_24h);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-badge px-3 py-1.5 text-sm font-medium ${
                filter === f.key
                  ? "bg-taloa-primary text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={only24h}
            onChange={(e) => setOnly24h(e.target.checked)}
          />
          24h Only
        </label>
      </div>

      <p className="text-xs text-slate-400">
        {visible.length} clinic{visible.length === 1 ? "" : "s"}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-card bg-white p-8 text-center text-slate-500 shadow-sm">
          No clinics match this filter.
        </div>
      ) : (
        visible.map((vet) => <EmergencyVetCard key={vet.id} vet={vet} />)
      )}
    </div>
  );
}
