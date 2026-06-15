export type BillingInterval = "month" | "year" | "one_time";

export interface Plan {
  name: string;
  display_name: string;
  description: string | null;
  price_eur: number;
  billing_interval: BillingInterval;
  max_pets: number;
  features: string[];
  sort_order: number;
}
