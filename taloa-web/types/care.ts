// Pet Sitter Share (Etapa 25). Care link mostra o perfil completo (medicacao,
// notas privadas, telefone do dono) — NUNCA endereco/email.
import type { Activity, HealthRecord } from "@/types/diary";

export type CareDuration = "3d" | "1w" | "2w" | "1mo";

export interface CareShare {
  id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
  show_diary: boolean;
  created_at: string | null;
  care_url: string | null;
}

export interface CareProfile {
  pet_name: string;
  species: string;
  breed_or_morph: string | null;
  sex: string | null;
  age_years: number | null;
  date_of_birth: string | null;
  colour: string | null;
  photo_url: string | null;
  tag_code: string | null;
  tag_type: string | null;
  medication: string | null;
  allergies: string | null;
  behaviour: string | null;
  likes: string | null;
  dislikes: string | null;
  feeding_schedule: string | null;
  emergency_notes: string | null;
  public_notes: string | null;
  private_notes: string | null;
  habitat_temp_min: number | null;
  habitat_temp_max: number | null;
  humidity_notes: string | null;
  lighting_notes: string | null;
  handling_notes: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  owner_phone: string | null;
  expires_at: string | null;
  // diario read-only (so se o dono ativou show_diary)
  show_diary: boolean;
  diary_activities: Activity[];
  diary_health: HealthRecord[];
}
