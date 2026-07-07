// Tipos do Exotic Care Guide (Etapa 29) — espelham app/schemas/care_guide.py.

export type CareGuideSectionKey =
  | "habitat"
  | "feeding"
  | "environment"
  | "handling"
  | "hygiene"
  | "enrichment"
  | "warning_signs";

export type CareGuideSection = {
  key: CareGuideSectionKey;
  tips: string[]; // tip_keys traduzidas por i18n (careGuide.tips.*)
};

export type CareGuideResponse = {
  species: string;
  sections: CareGuideSection[];
};

// Especies com guia (a API revalida server-side; aqui so decide mostrar a aba).
export const EXOTIC_SPECIES = [
  "reptile",
  "bird",
  "rabbit",
  "small_mammal",
  "fish",
  "other",
] as const;

export function isExoticSpecies(species: string): boolean {
  return (EXOTIC_SPECIES as readonly string[]).includes(species);
}
