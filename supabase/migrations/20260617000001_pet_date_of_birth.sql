-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0011: data de nascimento do pet (Pet Identity Card)
-- Campo opcional usado na carteira digital (/card/[tagCode]). Quando vazio,
-- o card cai para age_years. Nao-destrutivo.
-- (microchip ja existe em pets.microchip — reutilizado, sem novo campo.)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;
