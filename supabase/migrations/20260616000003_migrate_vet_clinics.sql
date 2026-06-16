-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0009: Partners Directory (Etapa 23, passo 2)
-- Migra as 11 clinicas de vet_clinics para service_providers.
-- Categoria derivada: 24h -> vet_emergency; reptil/ave -> vet_exotic;
-- senao -> vet_general. vet_clinics fica INTACTA (validar /emergency antes
-- de qualquer remocao). Guard por `name` torna a migracao idempotente.
-- ════════════════════════════════════════════════════════════

INSERT INTO public.service_providers (
  name, category, phone, website, address, area,
  species_supported, emergency_24h, hours, notes,
  is_verified, is_active
)
SELECT
  v.name,
  CASE
    WHEN v.emergency_24h = true THEN 'vet_emergency'
    WHEN 'reptile' = ANY(v.species_supported) OR 'bird' = ANY(v.species_supported)
      THEN 'vet_exotic'
    ELSE 'vet_general'
  END AS category,
  v.phone, v.website, v.address, v.area,
  v.species_supported, v.emergency_24h, v.hours, v.notes,
  v.is_verified, v.is_active
FROM public.vet_clinics v
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_providers sp WHERE sp.name = v.name
);
