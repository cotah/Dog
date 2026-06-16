// Catalogo das 18 categorias do Partners Directory (Etapa 23).
// Ordem = grid visual da pagina /directory (secao 5.2 do briefing).
// O label de cada categoria vem do i18n: t(`cat.${slug}`).

export const DIRECTORY_CATEGORIES = [
  { slug: "vet_emergency", icon: "🚨" },
  { slug: "vet_general", icon: "🏥" },
  { slug: "vet_exotic", icon: "🦎" },
  { slug: "insurance", icon: "🛡️" },
  { slug: "grooming", icon: "✂️" },
  { slug: "dog_walking", icon: "🦮" },
  { slug: "dog_daycare", icon: "🏠" },
  { slug: "dog_hotel", icon: "🛏️" },
  { slug: "training", icon: "🎓" },
  { slug: "pet_sitting", icon: "🏡" },
  { slug: "taxi_dog", icon: "🚗" },
  { slug: "travel_services", icon: "✈️" },
  { slug: "pet_shop", icon: "🛒" },
  { slug: "fresh_food", icon: "🥩" },
  { slug: "homemade_treats", icon: "🦴" },
  { slug: "photography", icon: "📸" },
  { slug: "dog_fashion", icon: "👗" },
  { slug: "other", icon: "⭐" },
] as const;

export type CategorySlug = (typeof DIRECTORY_CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS: string[] = DIRECTORY_CATEGORIES.map((c) => c.slug);

export const CATEGORY_ICON: Record<string, string> = Object.fromEntries(
  DIRECTORY_CATEGORIES.map((c) => [c.slug, c.icon]),
);
