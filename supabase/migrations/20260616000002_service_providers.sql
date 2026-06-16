-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0008: Partners Directory (Etapa 23, passo 1)
-- Nova tabela service_providers: diretorio completo de servicos para pets
-- (engloba os vets, que serao migrados de vet_clinics no passo 2).
-- vet_clinics NAO e apagada aqui — fica intacta ate a migracao ser validada.
-- ════════════════════════════════════════════════════════════

CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'vet_emergency', 'vet_general', 'vet_exotic',
    'grooming', 'dog_walking', 'dog_daycare', 'dog_hotel', 'pet_sitting',
    'training', 'pet_shop', 'fresh_food', 'homemade_treats',
    'taxi_dog', 'travel_services', 'insurance', 'photography',
    'dog_fashion', 'other'
  )),
  description TEXT,
  phone TEXT,
  email TEXT,                       -- NUNCA exposto publicamente (so admin/contato interno)
  website TEXT,
  address TEXT,
  area TEXT,                        -- ex: Dublin 4, Dublin 6, Dublin City
  eircode TEXT,
  species_supported TEXT[],         -- ex: {dog,cat,reptile,bird,rabbit}
  emergency_24h BOOLEAN DEFAULT FALSE,
  hours TEXT,                       -- ex: Mon-Fri 9am-6pm, Sat 10am-4pm
  price_range TEXT,                 -- ex: €, €€, €€€
  languages TEXT[],                 -- ex: {en,pt,es}
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_taloa_partner BOOLEAN DEFAULT FALSE,
  partner_discount TEXT,            -- ex: 10% off first session for TALOA members
  notes TEXT,
  photo_url TEXT,
  logo_url TEXT,
  rating DECIMAL(2,1),              -- ex: 4.5 (so exibicao; sem sistema de reviews nesta etapa)
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX idx_service_providers_category ON public.service_providers(category);
CREATE INDEX idx_service_providers_area ON public.service_providers(area);
CREATE INDEX idx_service_providers_active ON public.service_providers(is_active);
CREATE INDEX idx_service_providers_species
  ON public.service_providers USING GIN(species_supported);

-- ── updated_at automatico (mesma function dos outros) ──
CREATE TRIGGER trg_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS: leitura publica SO de ativos; escrita somente admin ──
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_providers_select_public ON public.service_providers
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY service_providers_insert ON public.service_providers
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY service_providers_update ON public.service_providers
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY service_providers_delete ON public.service_providers
  FOR DELETE USING (public.is_admin());
