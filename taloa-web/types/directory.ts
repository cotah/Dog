// Tipos do Partners Directory (Etapa 23). PublicProvider NUNCA tem email.

export interface PublicProvider {
  id: string;
  name: string;
  category: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  area: string | null;
  eircode: string | null;
  species_supported: string[] | null;
  emergency_24h: boolean;
  hours: string | null;
  price_range: string | null;
  languages: string[] | null;
  is_verified: boolean;
  is_featured: boolean;
  is_taloa_partner: boolean;
  partner_discount: string | null;
  photo_url: string | null;
  logo_url: string | null;
  rating: number | null;
  review_count: number;
}

export interface AdminProvider extends PublicProvider {
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProviderPayload {
  name: string;
  category: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  area?: string | null;
  eircode?: string | null;
  species_supported?: string[] | null;
  emergency_24h?: boolean;
  hours?: string | null;
  price_range?: string | null;
  languages?: string[] | null;
  is_verified?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  is_taloa_partner?: boolean;
  partner_discount?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  logo_url?: string | null;
  rating?: number | null;
  review_count?: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}
