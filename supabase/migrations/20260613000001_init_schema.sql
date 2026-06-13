-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0001: Schema inicial
-- Secao 4 do brief. REGRA: nunca usar 'dog' — sempre 'pet'.
-- ════════════════════════════════════════════════════════════

-- ── Função utilitaria: atualizar updated_at automaticamente ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''            -- search_path fixo (Supabase linter 0011)
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4.1 users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  emergency_phone TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'partner')),
  address_private TEXT,
  eircode_private TEXT,
  gdpr_consent BOOLEAN DEFAULT FALSE,
  gdpr_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4.2 pets
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'dog',
  -- especies: dog, cat, bird, reptile, rabbit, small_mammal, fish, other
  breed_or_morph TEXT,
  sex TEXT CHECK (sex IN ('male', 'female', 'unknown')),
  age_years INT,
  colour TEXT,
  microchip TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pets_owner_id ON public.pets(owner_id);

CREATE TRIGGER trg_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4.3 pet_profiles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.pet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE UNIQUE,
  allergies TEXT,
  medication TEXT,
  behaviour TEXT,
  likes TEXT,
  dislikes TEXT,
  vet_name TEXT,
  vet_phone TEXT,
  public_notes TEXT,
  private_notes TEXT,
  show_phone BOOLEAN DEFAULT TRUE,
  show_email BOOLEAN DEFAULT FALSE,
  emergency_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_profiles_pet_id ON public.pet_profiles(pet_id);

CREATE TRIGGER trg_pet_profiles_updated_at
  BEFORE UPDATE ON public.pet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4.4 tags
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code TEXT NOT NULL UNIQUE,          -- ex: TAL-000001
  tag_url TEXT NOT NULL,                  -- ex: https://taloa.ie/t/TAL-000001
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'active', 'lost', 'disabled')),
  tag_type TEXT DEFAULT 'collar_tag'
    CHECK (tag_type IN ('collar_tag', 'cage_card', 'enclosure_sticker', 'emergency_card')),
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  batch_id TEXT,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_tag_code ON public.tags(tag_code);
CREATE INDEX idx_tags_pet_id ON public.tags(pet_id);
CREATE INDEX idx_tags_owner_id ON public.tags(owner_id);
CREATE INDEX idx_tags_status ON public.tags(status);

CREATE TRIGGER trg_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4.5 scans
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  action_taken TEXT,
  -- acoes: viewed_profile, clicked_call_owner, clicked_emergency,
  --        clicked_found_pet, shared_location, viewed_lost_page
  ip_hash TEXT,                           -- hash SHA-256 do IP, nunca IP raw
  location_lat DECIMAL,                   -- somente se usuario permitir
  location_lng DECIMAL,                   -- somente se usuario permitir
  location_granted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_scans_tag_code ON public.scans(tag_code);
CREATE INDEX idx_scans_scanned_at ON public.scans(scanned_at);

-- ─────────────────────────────────────────────────────────────
-- 4.6 vet_clinics
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.vet_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  area TEXT,                              -- ex: Dublin 4, Dublin 6
  species_supported TEXT[],              -- ex: {dog,cat,reptile,bird}
  emergency_24h BOOLEAN DEFAULT FALSE,
  hours TEXT,
  website TEXT,
  notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vet_clinics_area ON public.vet_clinics(area);
CREATE INDEX idx_vet_clinics_emergency_24h ON public.vet_clinics(emergency_24h);

CREATE TRIGGER trg_vet_clinics_updated_at
  BEFORE UPDATE ON public.vet_clinics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4.7 leads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id),
  pet_id UUID REFERENCES public.pets(id),
  tag_code TEXT,
  service_type TEXT NOT NULL,
  -- servicos: dog_walking, grooming, training, daycare,
  --           pet_sitting, emergency_support, premium_tag, other
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  partner_id UUID REFERENCES public.users(id),
  commission_estimate DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX idx_leads_status ON public.leads(status);

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4.8 lost_reports
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.lost_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id),
  tag_code TEXT,
  last_seen_at TIMESTAMPTZ,
  last_seen_area TEXT,
  description TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'found', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lost_reports_pet_id ON public.lost_reports(pet_id);
CREATE INDEX idx_lost_reports_tag_code ON public.lost_reports(tag_code);

CREATE TRIGGER trg_lost_reports_updated_at
  BEFORE UPDATE ON public.lost_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4.9 found_reports
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.found_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code TEXT,
  found_at TIMESTAMPTZ DEFAULT NOW(),
  found_area TEXT,
  photo_url TEXT,
  notes TEXT,
  finder_phone TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  location_granted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_found_reports_tag_code ON public.found_reports(tag_code);

-- ─────────────────────────────────────────────────────────────
-- 4.10 ai_conversations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  tag_code TEXT,
  session_id TEXT,
  messages JSONB DEFAULT '[]',
  context TEXT,                           -- 'emergency', 'lost_pet', 'general'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_session_id ON public.ai_conversations(session_id);

CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
