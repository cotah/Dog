// Tipos do Pet Diary, Health Records e Shedding (Etapa 27).

export interface Activity {
  id: string;
  activity_type: string;
  duration_minutes: number | null;
  distance_meters: number | null;
  notes: string | null;
  recorded_by: string;
  walker_name: string | null;
  occurred_at: string | null;
  created_at: string | null;
}

export interface ActivityPayload {
  activity_type: string;
  duration_minutes?: number | null;
  distance_meters?: number | null;
  notes?: string | null;
  walker_name?: string | null;
  occurred_at?: string | null;
}

export interface HealthRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  date: string;
  next_due_date: string | null;
  vet_name: string | null;
  attachments: string[] | null;
  created_at: string | null;
}

export interface HealthPayload {
  record_type: string;
  title: string;
  description?: string | null;
  date: string;
  next_due_date?: string | null;
  vet_name?: string | null;
}

export interface SheddingRecord {
  id: string;
  shed_type: string;
  started_at: string;
  ended_at: string | null;
  intensity: string | null;
  was_complete: boolean | null;
  notes: string | null;
  created_at: string | null;
}

export interface SheddingPayload {
  shed_type: string;
  started_at: string;
  intensity?: string | null;
  was_complete?: boolean | null;
  notes?: string | null;
}

export interface SheddingClosePayload {
  ended_at?: string | null;
  intensity?: string | null;
  was_complete?: boolean | null;
  notes?: string | null;
}

export interface UpcomingDue {
  id: string;
  record_type: string;
  title: string;
  next_due_date: string;
  days_until: number;
}

export interface DiarySummary {
  walk_minutes_week: number;
  last_bath_at: string | null;
  upcoming_due: UpcomingDue[];
  last_weight_kg: number | null;
  weight_change_kg: number | null;
}
