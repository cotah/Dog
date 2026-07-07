// Tipos do Travel Checklist (Etapa 28). Espelham schemas/travel.py da API.
export type TravelType = "car" | "plane" | "ferry" | "train";
export type TripScope = "domestic" | "international";
export type ItemSection = "documents" | "transport" | "essentials";

export interface ChecklistItem {
  id: string;
  item_key: string | null; // template (i18n); null = custom
  label: string | null;    // so custom
  section: ItemSection;
  is_checked: boolean;
  due_date: string | null; // ISO date
  sort_order: number;
}

export interface TripSummary {
  id: string;
  title: string | null;
  travel_type: TravelType;
  scope: TripScope;
  destination: string | null;
  travel_date: string;
  checked_count: number;
  total_count: number;
  created_at: string | null;
}

export interface TripDetail extends TripSummary {
  items: ChecklistItem[];
}

export interface TripPayload {
  title?: string;
  travel_type: TravelType;
  scope: TripScope;
  destination?: string;
  travel_date: string;
}
