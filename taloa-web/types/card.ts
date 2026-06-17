// Pet Identity Card (Etapa 24). NUNCA tem endereco/email do dono.
export interface PetCard {
  tag_code: string;
  name: string;
  species: string;
  breed_or_morph: string | null;
  colour: string | null;
  sex: string | null;
  age_years: number | null;
  date_of_birth: string | null;
  microchip: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  allergies: string | null;
  behaviour: string | null;
  photo_url: string | null;
  owner_phone: string | null; // so se o dono ativou show_phone
  profile_url: string;
}
