-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0005: novos tag types + campos por tipo (Etapa 19)
-- Brief v2.0 secao 2. As 9 tags atuais sao todas 'collar_tag', entao a troca
-- do CHECK e segura (nenhuma linha a migrar).
-- ════════════════════════════════════════════════════════════

-- 1. tags.tag_type: novo conjunto de valores aprovados.
--    (drop robusto: acha o nome real da constraint de check de tag_type)
DO $$
DECLARE c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.tags'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%tag_type%';
  IF c_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tags DROP CONSTRAINT ' || quote_ident(c_name);
  END IF;
END $$;

ALTER TABLE public.tags
  ADD CONSTRAINT tags_tag_type_check
  CHECK (tag_type IN (
    'collar_tag', 'cat_collar_tag', 'travel_id', 'habitat_id', 'emergency_card'
  ));

-- 2. pet_profiles: campos especificos por tag_type.
ALTER TABLE public.pet_profiles
  -- travel_id
  ADD COLUMN IF NOT EXISTS travel_notes TEXT,
  ADD COLUMN IF NOT EXISTS airline_approved BOOLEAN,
  -- habitat_id (exoticos)
  ADD COLUMN IF NOT EXISTS habitat_temp_min DECIMAL,
  ADD COLUMN IF NOT EXISTS habitat_temp_max DECIMAL,
  ADD COLUMN IF NOT EXISTS feeding_schedule TEXT,
  ADD COLUMN IF NOT EXISTS handling_notes TEXT,
  ADD COLUMN IF NOT EXISTS lighting_notes TEXT,
  ADD COLUMN IF NOT EXISTS humidity_notes TEXT,
  -- emergency_card
  ADD COLUMN IF NOT EXISTS critical_conditions TEXT,
  ADD COLUMN IF NOT EXISTS critical_medication TEXT,
  ADD COLUMN IF NOT EXISTS blood_type TEXT;
