-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0015: Travel Checklist (Etapa 28)
-- Checklist de preparacao de viagem por pet. Duas tabelas:
--   pet_trips            — uma viagem (tipo, escopo, data, destino)
--   trip_checklist_items — itens da checklist (template ou custom)
-- Itens de template guardam item_key (i18n no frontend); custom guardam label.
-- RLS: dono ve/edita SO os seus; admin ve tudo. Nunca publico.
-- Feature Plus+ — o gating por plano e feito na API (require_active_subscription).
-- ════════════════════════════════════════════════════════════

-- ── pet_trips ───────────────────────────────────────────────
CREATE TABLE public.pet_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('car', 'plane', 'ferry', 'train')),
  scope TEXT NOT NULL CHECK (scope IN ('domestic', 'international')),
  destination TEXT,
  travel_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_trips_pet ON public.pet_trips(pet_id, travel_date DESC);

-- ── trip_checklist_items ────────────────────────────────────
CREATE TABLE public.trip_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.pet_trips(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_key TEXT,
  label TEXT,
  section TEXT NOT NULL CHECK (section IN ('documents', 'transport', 'essentials')),
  is_checked BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- template XOR custom: exatamente um dos dois preenchido
  CONSTRAINT trip_item_key_xor_label CHECK (
    (item_key IS NOT NULL AND label IS NULL) OR (item_key IS NULL AND label IS NOT NULL)
  )
);

CREATE INDEX idx_trip_items_trip ON public.trip_checklist_items(trip_id, sort_order);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.pet_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_trips_select ON public.pet_trips
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_trips_insert ON public.pet_trips
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_trips_update ON public.pet_trips
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY pet_trips_delete ON public.pet_trips
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY trip_items_select ON public.trip_checklist_items
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY trip_items_insert ON public.trip_checklist_items
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY trip_items_update ON public.trip_checklist_items
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY trip_items_delete ON public.trip_checklist_items
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());
