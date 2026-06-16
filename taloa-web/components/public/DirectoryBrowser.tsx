"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DIRECTORY_CATEGORIES } from "@/lib/directory";
import type { CategoryCount, PublicProvider } from "@/types/directory";

import { DirectoryMap } from "./DirectoryMap";
import { ProviderCard } from "./ProviderCard";

function speciesKey(s: string): string {
  return `species${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

export function DirectoryBrowser({
  providers,
  categories,
  initialCategory,
  initialEmergency = false,
}: {
  providers: PublicProvider[];
  categories: CategoryCount[];
  initialCategory?: string;
  initialEmergency?: boolean;
}) {
  const t = useTranslations("directory");
  const ts = useTranslations("emergency");

  const [category, setCategory] = useState<string | null>(initialCategory ?? null);
  const [area, setArea] = useState("");
  const [species, setSpecies] = useState("");
  const [only24h, setOnly24h] = useState(initialEmergency);
  const [search, setSearch] = useState("");

  const countByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of categories) m[c.category] = c.count;
    return m;
  }, [categories]);

  const areas = useMemo(
    () =>
      Array.from(new Set(providers.map((p) => p.area).filter(Boolean) as string[])).sort(),
    [providers],
  );
  const speciesList = useMemo(
    () =>
      Array.from(
        new Set(providers.flatMap((p) => p.species_supported ?? [])),
      ).sort(),
    [providers],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return providers.filter((p) => {
      if (category && p.category !== category) return false;
      if (area && p.area !== area) return false;
      if (species && !(p.species_supported ?? []).includes(species)) return false;
      if (only24h && !p.emergency_24h) return false;
      if (q) {
        const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [providers, category, area, species, only24h, search]);

  const hasFilters = category || area || species || only24h || search;

  function clearAll() {
    setCategory(null);
    setArea("");
    setSpecies("");
    setOnly24h(false);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Grid de categorias */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {DIRECTORY_CATEGORIES.map((c) => {
          const selected = category === c.slug;
          const n = countByCat[c.slug] ?? 0;
          return (
            <button
              key={c.slug}
              onClick={() => setCategory(selected ? null : c.slug)}
              className={`flex items-center gap-2 rounded-card border p-2.5 text-left text-sm transition ${
                selected
                  ? "border-taloa-primary bg-taloa-primary/10"
                  : "border-slate-200 bg-white hover:border-taloa-primary/40"
              }`}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-700">
                  {t.has(`cat.${c.slug}`) ? t(`cat.${c.slug}`) : c.slug}
                </span>
                <span className="text-xs text-slate-400">{n}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2 rounded-card bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className="h-11 w-full rounded-input border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-taloa-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="h-10 rounded-input border border-slate-300 px-2 text-sm text-slate-600 outline-none focus:border-taloa-primary"
          >
            <option value="">{t("all_areas")}</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="h-10 rounded-input border border-slate-300 px-2 text-sm text-slate-600 outline-none focus:border-taloa-primary"
          >
            <option value="">{t("all_species")}</option>
            {speciesList.map((s) => (
              <option key={s} value={s}>
                {ts.has(speciesKey(s)) ? ts(speciesKey(s)) : s}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={only24h}
              onChange={(e) => setOnly24h(e.target.checked)}
            />
            {t("only_24h")}
          </label>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="ml-auto flex items-center gap-1 text-sm text-taloa-primary hover:underline"
            >
              <X className="h-3.5 w-3.5" /> {t("clear_filters")}
            </button>
          )}
        </div>
      </div>

      {/* Mapa: pins dos providers (filtrados) que tem coordenadas.
          Mobile-first — fica acima da lista. */}
      <DirectoryMap providers={visible} />

      <p className="text-xs text-slate-400">
        {t("result_count", { count: visible.length })}
      </p>

      {/* Resultados */}
      {visible.length === 0 ? (
        <div className="rounded-card bg-white p-8 text-center text-slate-500 shadow-sm">
          {t("no_results")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
}
