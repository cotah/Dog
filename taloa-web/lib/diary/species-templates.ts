// Templates do Pet Diary por especie (Etapa 27).
// Define, para cada especie, que tipos de atividade aparecem no modal "Add
// Activity" e que campos cada tipo mostra. Shedding/molting tem a sua propria
// seccao (pet_shedding_records), por isso vive em `shedding`, nao na lista de
// atividades. As chaves de especie sao os valores guardados no DB
// (pets.species): small_mammal (nao "small_pet").

export type Species =
  | "dog"
  | "cat"
  | "reptile"
  | "bird"
  | "rabbit"
  | "small_mammal"
  | "fish"
  | "other";

export type ShedType = "fur" | "skin" | "feathers";

// Widgets que o modal pode renderizar. O modal mapeia cada um para o body da
// API: duration->duration_minutes, distance->distance_meters, walker->
// walker_name, e notes/weight/feeding->notes (so um por tipo, sem conflito).
export type ActivityField =
  | "duration"
  | "distance"
  | "walker"
  | "weight"
  | "feeding"
  | "notes";

export interface ActivityMeta {
  fields: ActivityField[];
  icon: string; // nome de icone lucide, resolvido no componente
}

// Campos e icone por tipo de atividade.
export const ACTIVITY_META: Record<string, ActivityMeta> = {
  walk: { fields: ["duration", "distance", "walker", "notes"], icon: "footprints" },
  grooming: { fields: ["notes"], icon: "scissors" },
  bath: { fields: ["notes"], icon: "droplets" },
  nail_trim: { fields: ["notes"], icon: "scissors" },
  ear_clean: { fields: ["notes"], icon: "ear" },
  dental: { fields: ["notes"], icon: "smile" },
  hairball: { fields: ["notes"], icon: "circle-dot" },
  vet_visit: { fields: ["notes"], icon: "stethoscope" },
  medication: { fields: ["notes"], icon: "pill" },
  weight: { fields: ["weight"], icon: "scale" },
  feeding: { fields: ["feeding"], icon: "utensils" },
  uv_bath: { fields: ["duration", "notes"], icon: "sun" },
  water_change: { fields: ["notes"], icon: "droplets" },
  habitat_check: { fields: ["notes"], icon: "thermometer" },
  parameters_check: { fields: ["notes"], icon: "flask-conical" },
  treatment: { fields: ["notes"], icon: "pill" },
  beak_trim: { fields: ["notes"], icon: "scissors" },
  socialization: { fields: ["duration", "notes"], icon: "heart" },
  note: { fields: ["notes"], icon: "pencil" },
};

export interface SheddingConfig {
  shedType: ShedType;
  // fur usa intensidade (light/medium/heavy); skin/feathers usa was_complete
  // (ecdise/muda completa ou parcial).
  field: "intensity" | "complete";
  // chave i18n do nome da seccao: shedding | ecdysis | molt
  labelKey: "shedding" | "ecdysis" | "molt";
}

export interface SpeciesTemplate {
  activities: string[]; // tipos para o modal Add Activity
  shedding?: SheddingConfig; // seccao de troca de pelo/pele/penas (opcional)
}

export const SPECIES_TEMPLATES: Record<Species, SpeciesTemplate> = {
  dog: {
    activities: [
      "walk",
      "grooming",
      "bath",
      "nail_trim",
      "ear_clean",
      "vet_visit",
      "medication",
      "weight",
      "note",
    ],
    shedding: { shedType: "fur", field: "intensity", labelKey: "shedding" },
  },
  cat: {
    activities: [
      "grooming",
      "bath",
      "nail_trim",
      "dental",
      "vet_visit",
      "medication",
      "weight",
      "hairball",
      "note",
    ],
    shedding: { shedType: "fur", field: "intensity", labelKey: "shedding" },
  },
  reptile: {
    activities: [
      "feeding",
      "uv_bath",
      "habitat_check",
      "vet_visit",
      "weight",
      "note",
    ],
    shedding: { shedType: "skin", field: "complete", labelKey: "ecdysis" },
  },
  bird: {
    activities: [
      "feeding",
      "nail_trim",
      "beak_trim",
      "socialization",
      "vet_visit",
      "weight",
      "note",
    ],
    shedding: { shedType: "feathers", field: "complete", labelKey: "molt" },
  },
  rabbit: {
    activities: [
      "feeding",
      "nail_trim",
      "dental",
      "weight",
      "grooming",
      "vet_visit",
      "note",
    ],
    shedding: { shedType: "fur", field: "intensity", labelKey: "shedding" },
  },
  small_mammal: {
    activities: ["feeding", "weight", "nail_trim", "vet_visit", "note"],
  },
  fish: {
    activities: ["water_change", "feeding", "parameters_check", "treatment", "note"],
  },
  other: {
    activities: ["feeding", "vet_visit", "weight", "note"],
  },
};

// Tipos de health record (seccao Health Records, independente da especie).
export const HEALTH_RECORD_TYPES = [
  "vaccine",
  "deworming",
  "vet_visit",
  "medication",
  "allergy",
  "surgery",
  "weight",
  "dental",
] as const;

export function templateFor(species: string): SpeciesTemplate {
  return SPECIES_TEMPLATES[(species as Species)] ?? SPECIES_TEMPLATES.other;
}
