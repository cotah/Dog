// Especies aceitas (espelha SPECIES_LIST do backend).
export const SPECIES_OPTIONS: { value: string; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "reptile", label: "Reptile" },
  { value: "rabbit", label: "Rabbit" },
  { value: "small_mammal", label: "Small mammal" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
];

export const TAG_PREFIX = process.env.NEXT_PUBLIC_TAG_PREFIX ?? "TAL";
