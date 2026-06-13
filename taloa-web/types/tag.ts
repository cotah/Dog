export type TagStatus = "inactive" | "active" | "lost" | "disabled";

export interface PublicPet {
  name: string;
  species: string;
  breed_or_morph: string | null;
  sex: string | null;
  age_years: number | null;
  colour: string | null;
  photo_url: string | null;
}

export interface PublicProfile {
  allergies: string | null;
  medication: string | null;
  behaviour: string | null;
  likes: string | null;
  dislikes: string | null;
  public_notes: string | null;
  emergency_notes: string | null;
  vet_name: string | null;
  vet_phone: string | null;
}

export interface PublicContact {
  show_phone: boolean;
  show_email: boolean;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}

export interface LostInfo {
  last_seen_at: string | null;
  last_seen_area: string | null;
  description: string | null;
}

export interface PublicTag {
  tag_code: string;
  status: TagStatus;
  tag_type: string | null;
  pet: PublicPet | null;
  profile: PublicProfile | null;
  contact: PublicContact | null;
  lost: LostInfo | null;
}
