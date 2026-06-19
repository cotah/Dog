import type { TagStatus } from "@/types/tag";

export interface LastScan {
  scanned_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_granted: boolean;
}

export interface TagInfo {
  tag_code: string;
  status: TagStatus;
  tag_type: string | null;
}

export interface HealthAlert {
  title: string;
  record_type: string;
  next_due_date: string;
  days_until: number; // negativo = expirado
}

export interface PetSummary {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
  breed_or_morph: string | null;
  sex: string | null;
  age_years: number | null;
  date_of_birth: string | null;
  colour: string | null;
  microchip: string | null;
  allergies: string | null;
  medication: string | null;
  behaviour: string | null;
  public_notes: string | null;
  emergency_notes: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  show_phone: boolean;
  show_email: boolean;
  // campos por tag_type (Etapa 19)
  travel_notes: string | null;
  airline_approved: boolean | null;
  habitat_temp_min: number | null;
  habitat_temp_max: number | null;
  feeding_schedule: string | null;
  handling_notes: string | null;
  lighting_notes: string | null;
  humidity_notes: string | null;
  critical_conditions: string | null;
  critical_medication: string | null;
  blood_type: string | null;
  tag: TagInfo | null;
  last_scan: LastScan | null;
  health_alert: HealthAlert | null;
}

export interface FoundReportSummary {
  id: string;
  tag_code: string | null;
  pet_name: string | null;
  found_area: string | null;
  notes: string | null;
  finder_phone: string | null;
  created_at: string | null;
}

export interface OwnerInfo {
  name: string | null;
  email: string | null;
}

export interface PawTransaction {
  points: number;
  reason: string;
  created_at: string | null;
}

export interface PawPointsSummary {
  total: number;
  total_earned: number;
  transactions: PawTransaction[];
}

export interface Dashboard {
  owner: OwnerInfo;
  pets: PetSummary[];
  pending_found_reports: FoundReportSummary[];
  paw_points: PawPointsSummary;
}

export interface PetUpdatePayload {
  name?: string;
  species?: string;
  breed_or_morph?: string | null;
  sex?: string | null;
  age_years?: number | null;
  date_of_birth?: string | null;
  colour?: string | null;
  microchip?: string | null;
  photo_url?: string | null;
  allergies?: string | null;
  medication?: string | null;
  behaviour?: string | null;
  public_notes?: string | null;
  emergency_notes?: string | null;
  vet_name?: string | null;
  vet_phone?: string | null;
  show_phone?: boolean;
  show_email?: boolean;
  // campos por tag_type (Etapa 19)
  travel_notes?: string | null;
  airline_approved?: boolean | null;
  habitat_temp_min?: number | null;
  habitat_temp_max?: number | null;
  feeding_schedule?: string | null;
  handling_notes?: string | null;
  lighting_notes?: string | null;
  humidity_notes?: string | null;
  critical_conditions?: string | null;
  critical_medication?: string | null;
  blood_type?: string | null;
}
