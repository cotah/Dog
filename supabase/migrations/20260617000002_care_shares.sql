-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0012: Pet Sitter Share (Etapa 25)
-- Links temporarios para o dono partilhar o perfil COMPLETO do pet com um
-- carer (sitter, hotel, vet novo). Token UUID nao-adivinhavel; expira por
-- expires_at; revogavel por is_active. A leitura publica do token e feita
-- server-side via service role (sem policy publica nesta tabela).
-- ════════════════════════════════════════════════════════════

CREATE TABLE public.care_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_care_shares_token ON public.care_shares(token);
CREATE INDEX idx_care_shares_pet ON public.care_shares(pet_id);

-- ── RLS: o dono so ve/gere os seus proprios shares ──
ALTER TABLE public.care_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_shares_select ON public.care_shares
  FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY care_shares_insert ON public.care_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY care_shares_update ON public.care_shares
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY care_shares_delete ON public.care_shares
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());
