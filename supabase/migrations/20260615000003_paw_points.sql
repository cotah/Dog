-- ════════════════════════════════════════════════════════════
-- TALOA — Migration 0006: Paw Points (Etapa 20 / brief v2.0 secao 5)
-- paw_points: saldo por usuario. paw_points_transactions: historico.
-- Idempotencia "uma vez por pet/tag" via indice unico (user, reason, ref).
-- ════════════════════════════════════════════════════════════

CREATE TABLE public.paw_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.paw_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  points INT NOT NULL,                 -- positivo = ganhou, negativo = gastou
  reason TEXT NOT NULL,                -- profile_complete, tag_activation, pet_photo, pet_vet, subscription_renewal, referral
  ref TEXT,                            -- chave de dedup (pet_id / tag_code / invoice_id)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ppt_user ON public.paw_points_transactions(user_id);
-- "uma vez por (user, reason, ref)" quando ref nao e nulo
CREATE UNIQUE INDEX uq_ppt_once
  ON public.paw_points_transactions(user_id, reason, ref)
  WHERE ref IS NOT NULL;

CREATE TRIGGER trg_paw_points_updated_at
  BEFORE UPDATE ON public.paw_points
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS: usuario ve o proprio; escrita SOMENTE backend (service role) ──
ALTER TABLE public.paw_points              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paw_points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY paw_points_select ON public.paw_points
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY ppt_select ON public.paw_points_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
