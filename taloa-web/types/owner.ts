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
}

export interface PetSummary {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
  breed_or_morph: string | null;
  sex: string | null;
  age_years: number | null;
  colour: string | null;
  microchip: string | null;
  allergies: string | null;
  medication: string | null;
  behaviour: string | null;
  public_notes: string | null;
  emergency_notes: string | null;
  show_phone: boolean;
  show_email: boolean;
  tag: TagInfo | null;
  last_scan: LastScan | null;
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

export interface Dashboard {
  owner: OwnerInfo;
  pets: PetSummary[];
  pending_found_reports: FoundReportSummary[];
}

export interface PetUpdatePayload {
  name?: string;
  species?: string;
  breed_or_morph?: string | null;
  sex?: string | null;
  age_years?: number | null;
  colour?: string | null;
  microchip?: string | null;
  photo_url?: string | null;
  allergies?: string | null;
  medication?: string | null;
  behaviour?: string | null;
  public_notes?: string | null;
  emergency_notes?: string | null;
  show_phone?: boolean;
  show_email?: boolean;
}
