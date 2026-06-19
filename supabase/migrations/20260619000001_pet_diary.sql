-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0014: Pet Diary e Health Records (Etapa 27)
-- Diario digital por pet, adaptado por especie. Tres tabelas:
--   pet_activities       — logs rapidos do dia-a-dia (passeio, banho, peso...)
--   pet_health_records   — registos formais (vacinas, consultas) com next_due_date
--   pet_shedding_records — periodos de troca de pelo/pele/penas
-- RLS: o dono ve/edita SO os seus proprios registos; admin ve tudo.
-- Nunca exposto publicamente. care_shares.show_diary permite mostrar o diario
-- em modo read-only num care link, se o dono quiser (default false).
-- ════════════════════════════════════════════════════════════

-- ── pet_activities ──────────────────────────────────────────
CREATE TABLE public.pet_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'walk', 'grooming', 'bath', 'nail_trim', 'ear_clean', 'vet_visit',
    'medication', 'weight', 'note', 'shedding', 'molting', 'feeding',
    'uv_bath', 'water_change', 'dental', 'hairball', 'habitat_check',
    'beak_trim', 'socialization', 'parameters_check', 'treatment'
  )),
  duration_minutes INT,
  distance_meters INT,
  notes TEXT,
  recorded_by TEXT NOT NULL DEFAULT 'owner'
    CHECK (recorded_by IN ('owner', 'dogwalker', 'system')),
  walker_name TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_activities_pet ON public.pet_activities(pet_id);
CREATE INDEX idx_pet_activities_occurred
  ON public.pet_activities(pet_id, occurred_at DESC);

-- ── pet_health_records ──────────────────────────────────────
CREATE TABLE public.pet_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN (
    'vaccine', 'deworming', 'vet_visit', 'medication',
    'allergy', 'surgery', 'weight', 'dental'
  )),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  next_due_date DATE,
  vet_name TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_health_pet ON public.pet_health_records(pet_id);
-- alertas de renovacao por proximidade do next_due_date
CREATE INDEX idx_pet_health_due
  ON public.pet_health_records(pet_id, next_due_date);

-- ── pet_shedding_records ────────────────────────────────────
-- fur: caes/gatos/coelhos · skin: repteis (ecdise) · feathers: aves (molting)
CREATE TABLE public.pet_shedding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shed_type TEXT NOT NULL CHECK (shed_type IN ('fur', 'skin', 'feathers')),
  started_at DATE NOT NULL,
  ended_at DATE,
  intensity TEXT CHECK (intensity IN ('light', 'medium', 'heavy')),
  was_complete BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_shedding_pet ON public.pet_shedding_records(pet_id);

-- ── care_shares: mostrar diario no care link (read-only, opt-in) ──
ALTER TABLE public.care_shares
  ADD COLUMN show_diary BOOLEAN NOT NULL DEFAULT false;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.pet_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_shedding_records ENABLE ROW LEVEL SECURITY;

-- pet_activities
CREATE POLICY pet_activities_select ON public.pet_activities
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_activities_insert ON public.pet_activities
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_activities_update ON public.pet_activities
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_activities_delete ON public.pet_activities
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- pet_health_records
CREATE POLICY pet_health_select ON public.pet_health_records
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_health_insert ON public.pet_health_records
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_health_update ON public.pet_health_records
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_health_delete ON public.pet_health_records
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- pet_shedding_records
CREATE POLICY pet_shedding_select ON public.pet_shedding_records
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_shedding_insert ON public.pet_shedding_records
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_shedding_update ON public.pet_shedding_records
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_shedding_delete ON public.pet_shedding_records
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());
