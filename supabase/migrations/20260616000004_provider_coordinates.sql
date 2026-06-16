-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0010: coordenadas dos providers (mapa no /directory)
-- Adiciona latitude/longitude (nullable) a service_providers para exibir
-- pins no mapa interativo. Providers sem coordenadas continuam so na lista.
-- Nao-destrutivo: nenhuma coluna/dado existente e alterado.
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(9, 6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9, 6);
