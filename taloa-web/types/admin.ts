import type { TagStatus } from "@/types/tag";

export interface Metrics {
  total_tags: number;
  active: number;
  inactive: number;
  lost: number;
  disabled: number;
  total_pets: number;
  total_users: number;
  total_leads: number;
}

export interface ScanDaily {
  date: string;
  count: number;
}

export interface AdminTagRow {
  tag_code: string;
  status: TagStatus;
  pet_name: string | null;
  owner_email: string | null;
  activated_at: string | null;
  scan_count: number;
}

export interface AdminLeadRow {
  id: string;
  service_type: string;
  status: string | null;
  owner_name: string | null;
  owner_email: string | null;
  pet_name: string | null;
  created_at: string | null;
}

export interface VetClinic {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  area: string | null;
  species_supported: string[] | null;
  emergency_24h: boolean;
  hours: string | null;
  website: string | null;
  notes: string | null;
  is_verified: boolean;
  is_active: boolean;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string | null;
}

export interface AdminOverview {
  metrics: Metrics;
  scans_daily: ScanDaily[];
  tags: AdminTagRow[];
  leads: AdminLeadRow[];
  vets: VetClinic[];
  users: AdminUserRow[];
}

export interface VetPayload {
  name: string;
  phone: string;
  address?: string | null;
  area?: string | null;
  species_supported?: string[] | null;
  emergency_24h?: boolean;
  hours?: string | null;
  website?: string | null;
  notes?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
}
