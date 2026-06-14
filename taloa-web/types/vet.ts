export interface PublicVet {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  area: string | null;
  species_supported: string[] | null;
  emergency_24h: boolean;
  hours: string | null;
  website: string | null;
}
